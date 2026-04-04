import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { CliError } from "../errors/cli-error";
import { OutputService } from "./output-service";
import { detectPromptInjection, enforceInputSize, sanitizeInput } from "../utils/input-security";

const AnalyzeInputSchema = z
  .object({
    target: z.string().optional(),
    text: z.string().optional(),
    fallbackToLatest: z.boolean().optional()
  })
  .refine((value) => Boolean(value.target || value.text || value.fallbackToLatest), {
    message: "Forneca texto, caminho ou analise previa para continuar."
  });

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export type AnalysisResult = {
  source: "text" | "file" | "folder" | "latest";
  intent: string;
  context: string;
  theme: string;
  summary: string;
};

export class InputAnalyzerService {
  private readonly outputService = new OutputService();

  async analyze(input: AnalyzeInput): Promise<AnalysisResult> {
    const result = AnalyzeInputSchema.safeParse(input);
    if (!result.success) {
      throw new CliError("Entrada invalida para analise.", {
        code: "INVALID_ANALYZE_INPUT",
        hint: "Use repolaunch analyze --text \"seu conteudo\" ou informe um caminho valido."
      });
    }

    const parsed = result.data;

    if (parsed.text) {
      enforceInputSize(parsed.text);
      return this.extractFromText(parsed.text, "text");
    }

    if (parsed.target) {
      const stat = await this.safeStat(parsed.target);
      if (stat.isDirectory()) {
        const merged = await this.readFolderText(parsed.target);
        return this.extractFromText(merged, "folder");
      }

      const fileContent = await this.safeReadFile(parsed.target);
      enforceInputSize(fileContent);
      return this.extractFromText(fileContent, "file");
    }

    const latest = await this.safeReadLatestAnalysis();
    return {
      ...latest,
      source: "latest"
    };
  }

  private async readFolderText(folderPath: string): Promise<string> {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const chunks: string[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (![".md", ".txt"].includes(extension)) {
        continue;
      }

      const fullPath = path.join(folderPath, entry.name);
      const content = await this.safeReadFile(fullPath);
      chunks.push(content);
    }

    if (chunks.length === 0) {
      throw new Error("Nenhum arquivo .md ou .txt encontrado na pasta informada.");
    }

    return chunks.join("\n\n");
  }

  private async safeStat(targetPath: string): Promise<Awaited<ReturnType<typeof fs.stat>>> {
    try {
      return await fs.stat(targetPath);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new CliError(`Caminho nao encontrado: ${targetPath}`, {
          code: "TARGET_NOT_FOUND",
          hint: "Revise o caminho informado ou use --text para entrada direta."
        });
      }

      throw error;
    }
  }

  private async safeReadFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new CliError(`Arquivo nao encontrado: ${filePath}`, {
          code: "FILE_NOT_FOUND",
          hint: "Verifique o caminho do arquivo e tente novamente."
        });
      }

      throw error;
    }
  }

  private async safeReadLatestAnalysis(): Promise<AnalysisResult> {
    try {
      return await this.outputService.readJson<AnalysisResult>("latest-analysis.json");
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new CliError("Nenhuma analise previa encontrada.", {
          code: "ANALYSIS_NOT_FOUND",
          hint: "Execute repolaunch analyze --text \"seu conteudo\" antes de generate sem input."
        });
      }

      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    return "code" in error && (error as { code?: string }).code === "ENOENT";
  }

  private extractFromText(text: string, source: AnalysisResult["source"]): AnalysisResult {
    const sanitized = sanitizeInput(text);
    const hasPromptRisk = detectPromptInjection(text);
    const lowered = sanitized.toLowerCase();

    const intent =
      lowered.includes("portfolio") || lowered.includes("linkedin")
        ? "Construir projeto com foco em portfolio e visibilidade profissional"
        : "Transformar aprendizado em projeto executavel";

    const theme =
      lowered.includes("ia") || lowered.includes("ai")
        ? "IA aplicada"
        : lowered.includes("cli")
          ? "Ferramenta CLI"
          : "Projeto de software";

    const context = sanitized.slice(0, 280);
    const summary = sanitized.slice(0, 500);

    return {
      source,
      intent,
      theme,
      context,
      summary: hasPromptRisk ? `${summary} [alerta: possivel prompt injection detectado]` : summary
    };
  }
}
