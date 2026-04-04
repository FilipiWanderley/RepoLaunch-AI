import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { OutputService } from "./output-service";

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
    const parsed = AnalyzeInputSchema.parse(input);

    if (parsed.text) {
      return this.extractFromText(parsed.text, "text");
    }

    if (parsed.target) {
      const stat = await fs.stat(parsed.target);
      if (stat.isDirectory()) {
        const merged = await this.readFolderText(parsed.target);
        return this.extractFromText(merged, "folder");
      }

      const fileContent = await fs.readFile(parsed.target, "utf8");
      return this.extractFromText(fileContent, "file");
    }

    const latest = await this.outputService.readJson<AnalysisResult>("latest-analysis.json");
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
      const content = await fs.readFile(fullPath, "utf8");
      chunks.push(content);
    }

    if (chunks.length === 0) {
      throw new Error("Nenhum arquivo .md ou .txt encontrado na pasta informada.");
    }

    return chunks.join("\n\n");
  }

  private extractFromText(text: string, source: AnalysisResult["source"]): AnalysisResult {
    const sanitized = text.trim().replace(/\s+/g, " ");
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
      summary
    };
  }
}
