import { readEnv } from "../config/env";
import { logger } from "../utils/logger";

export type AIRequest = {
  systemPrompt: string;
  userInput: string;
  maxTokens?: number;
};

export type AIResponse = {
  content: string;
  provider: "anthropic" | "openai" | "mock";
};

export class AIEngine {
  private readonly aiLogger = logger.child("ai-engine");

  async generate(request: AIRequest): Promise<AIResponse> {
    const env = readEnv();

    if (env.ANTHROPIC_API_KEY) {
      try {
        return await this.withRetry(
          "anthropic",
          () => this.callAnthropic(env.ANTHROPIC_API_KEY!, env.DEFAULT_MODEL, request, env.AI_TIMEOUT_MS),
          env.AI_MAX_RETRIES
        );
      } catch (error) {
        this.aiLogger.warning("Falha no provider Anthropic, aplicando fallback", {
          reason: this.stringifyError(error)
        });
      }
    }

    if (env.OPENAI_API_KEY) {
      try {
        return await this.withRetry(
          "openai",
          () => this.callOpenAI(env.OPENAI_API_KEY!, env.OPENAI_MODEL, request, env.AI_TIMEOUT_MS),
          env.AI_MAX_RETRIES
        );
      } catch (error) {
        this.aiLogger.warning("Falha no provider OpenAI, aplicando fallback", {
          reason: this.stringifyError(error)
        });
      }
    }

    this.aiLogger.warning("Nenhuma chave de API valida encontrada. Usando modo mock.");
    const preview = `${request.systemPrompt}\n\n${request.userInput}`.slice(0, 300);
    return {
      content: `Mock response baseada no contexto: ${preview}`,
      provider: "mock"
    };
  }

  private async withRetry(
    provider: "anthropic" | "openai",
    operation: () => Promise<AIResponse>,
    maxRetries: number
  ): Promise<AIResponse> {
    const attempts = maxRetries + 1;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        if (attempt > 1) {
          this.aiLogger.info("Tentando novamente chamada ao provider", { provider, attempt, attempts });
        }
        return await operation();
      } catch (error) {
        const retryable = this.isRetryableError(error);
        const isLast = attempt === attempts;

        if (!retryable || isLast) {
          throw error;
        }

        await this.wait(250 * attempt);
      }
    }

    throw new Error("Fluxo de retry atingiu estado invalido.");
  }

  private async callAnthropic(
    apiKey: string,
    model: string,
    request: AIRequest,
    timeoutMs: number
  ): Promise<AIResponse> {
    const response = await this.fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 700,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userInput }]
      })
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`Anthropic HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };
    const text = payload.content?.[0]?.text?.trim();

    if (!text) {
      throw new Error("Anthropic retornou resposta vazia.");
    }

    return {
      content: text,
      provider: "anthropic"
    };
  }

  private async callOpenAI(
    apiKey: string,
    model: string,
    request: AIRequest,
    timeoutMs: number
  ): Promise<AIResponse> {
    const response = await this.fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userInput }
        ],
        max_tokens: request.maxTokens ?? 700
      })
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("OpenAI retornou resposta vazia.");
    }

    return {
      content: text,
      provider: "openai"
    };
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Timeout de provider apos ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRetryableError(error: unknown): boolean {
    const message = this.stringifyError(error).toLowerCase();

    if (message.includes("timeout") || message.includes("429")) {
      return true;
    }

    return message.includes("http 5");
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private stringifyError(error: unknown): string {
    return error instanceof Error ? error.message : "erro desconhecido";
  }
}
