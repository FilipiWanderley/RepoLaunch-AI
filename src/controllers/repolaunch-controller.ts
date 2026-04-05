import path from "node:path";
import { AIEngine } from "../ai/ai-engine";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/system-prompts";
import { ExecutionGuardService } from "../services/execution-guard-service";
import { InputAnalyzerService } from "../services/input-analyzer-service";
import { ProjectGeneratorService } from "../services/project-generator-service";
import { OutputService } from "../services/output-service";
import { ExportFormat, OutputMode, TemplateType } from "../types/output";
import { logger } from "../utils/logger";
import { validateOutputSafety } from "../utils/output-safety";

export class RepoLaunchController {
  private readonly aiEngine = new AIEngine();
  private readonly executionGuard = new ExecutionGuardService();
  private readonly inputAnalyzer = new InputAnalyzerService();
  private readonly projectGenerator = new ProjectGeneratorService();
  private readonly outputService = new OutputService();

  async init(): Promise<void> {
    await this.outputService.ensureBaseStructure();
    logger.info("Projeto inicializado com sucesso.");
  }

  async analyze(target?: string, text?: string): Promise<void> {
    const analysis = await this.inputAnalyzer.analyze({ target, text });
    await this.outputService.writeJson("latest-analysis.json", analysis);
    logger.info("Analise concluida.");
    logger.info(`Tema: ${analysis.theme}`);
    logger.info(`Intencao: ${analysis.intent}`);
  }

  async generate(
    target?: string,
    text?: string,
    mode: OutputMode = "technical",
    template: TemplateType = "portfolio-project"
  ): Promise<void> {
    this.executionGuard.assertCanExecute();

    const analysis = await this.inputAnalyzer.analyze({ target, text, fallbackToLatest: true });
    const aiResponse = await this.aiEngine.generate({
      systemPrompt: buildSystemPrompt(),
      userInput: buildUserPrompt(analysis),
      maxTokens: 650
    });
    const files = this.projectGenerator.generateFromAnalysis(analysis, {
      aiBrief: aiResponse.content,
      aiProvider: aiResponse.provider,
      mode,
      template
    });

    await this.outputService.ensureBaseStructure();
    for (const file of files) {
      const safeContent = validateOutputSafety(file.content);
      await this.outputService.writeText(file.fileName, safeContent);
      logger.info(`Gerado: ${path.join("outputs", file.fileName)}`);
    }

    await this.outputService.writeJson("latest-analysis.json", analysis);
    logger.info(`Geracao enriquecida via provider: ${aiResponse.provider}`);
    logger.info(`Modo de saida aplicado: ${mode}`);
    logger.info(`Template aplicado: ${template}`);
    logger.info("Geracao concluida.");
  }

  async exportOutputs(format: ExportFormat = "json"): Promise<void> {
    const manifest = await this.outputService.buildManifest();
    if (format === "json") {
      await this.outputService.writeJson("export-manifest.json", manifest);
      logger.info("Manifesto exportado para outputs/export-manifest.json");
      return;
    }

    if (format === "markdown") {
      const content = this.projectGenerator.buildMarkdownManifest(manifest.files);
      await this.outputService.writeText("export-manifest.md", content);
      logger.info("Manifesto exportado para outputs/export-manifest.md");
      return;
    }

    const analysis = await this.outputService.readJson<{
      theme: string;
      intent: string;
      summary: string;
    }>("latest-analysis.json");
    const issues = this.projectGenerator.buildIssuesSuggestions(analysis);
    await this.outputService.writeJson("github-issues.json", issues);
    logger.info("Sugestoes exportadas para outputs/github-issues.json");
  }
}
