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
  async generate(request: AIRequest): Promise<AIResponse> {
    const env = readEnv();

    if (env.ANTHROPIC_API_KEY) {
      try {
        return await this.callAnthropic(env.ANTHROPIC_API_KEY, env.DEFAULT_MODEL, request);
      } catch (error) {
        logger.warning(`Falha no provider Anthropic, aplicando fallback: ${this.stringifyError(error)}`);
      }
    }

    if (env.OPENAI_API_KEY) {
      try {
        return await this.callOpenAI(env.OPENAI_API_KEY, env.OPENAI_MODEL, request);
      } catch (error) {
        logger.warning(`Falha no provider OpenAI, aplicando fallback: ${this.stringifyError(error)}`);
      }
    }

    logger.warning("Nenhuma chave de API encontrada. Usando modo mock.");
    const preview = `${request.systemPrompt}\n\n${request.userInput}`.slice(0, 300);
    return {
      content: `Mock response baseada no contexto: ${preview}`,
      provider: "mock"
    };
  }

  private async callAnthropic(
    apiKey: string,
    model: string,
    request: AIRequest
  ): Promise<AIResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

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

  private async callOpenAI(apiKey: string, model: string, request: AIRequest): Promise<AIResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

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

  private stringifyError(error: unknown): string {
    return error instanceof Error ? error.message : "erro desconhecido";
  }
}
