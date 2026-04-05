import path from "node:path";
import { AIEngine } from "../ai/ai-engine";
import {
  buildSystemPrompt,
  buildUserPrompt,
  listPromptVersions,
  resolvePromptPack
} from "../prompts/system-prompts";
import { readEnv } from "../config/env";
import { ExecutionGuardService } from "../services/execution-guard-service";
import { GithubIntegrationService } from "../services/github-integration-service";
import { InputAnalyzerService } from "../services/input-analyzer-service";
import { ProjectGeneratorService } from "../services/project-generator-service";
import { RepoAnalyzerService } from "../services/repo-analyzer-service";
import { OutputService } from "../services/output-service";
import { ExportFormat, OutputMode, TemplateType } from "../types/output";
import { logger } from "../utils/logger";
import { validateOutputSafety } from "../utils/output-safety";

type PromptResolutionInfo = ReturnType<typeof resolvePromptPack>;

type GenerateBundle = {
  analysis: Awaited<ReturnType<InputAnalyzerService["analyze"]>>;
  aiResponse: Awaited<ReturnType<AIEngine["generate"]>>;
  promptResolution: PromptResolutionInfo;
  files: Array<{ fileName: string; content: string }>;
  mode: OutputMode;
  template: TemplateType;
};

export type WebGenerateResponse = {
  files: Record<string, string>;
  metadata: {
    provider: "anthropic" | "openai" | "mock";
    mode: OutputMode;
    template: TemplateType;
    promptVersion: string;
    promptRegistrySource: "file" | "embedded";
  };
};

export class RepoLaunchController {
  private readonly aiEngine = new AIEngine();
  private readonly executionGuard = new ExecutionGuardService();
  private readonly githubIntegration = new GithubIntegrationService();
  private readonly inputAnalyzer = new InputAnalyzerService();
  private readonly projectGenerator = new ProjectGeneratorService();
  private readonly repoAnalyzer = new RepoAnalyzerService();
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
    template: TemplateType = "portfolio-project",
    promptVersion?: string
  ): Promise<void> {
    this.executionGuard.assertCanExecute();
    const execution = await this.executeGeneration({
      target,
      text,
      mode,
      template,
      promptVersion,
      fallbackToLatest: true
    });

    await this.outputService.ensureBaseStructure();
    for (const file of execution.files) {
      const safeContent = validateOutputSafety(file.content);
      await this.outputService.writeText(file.fileName, safeContent);
      logger.info(`Gerado: ${path.join("outputs", file.fileName)}`);
    }

    await this.outputService.writeJson("latest-analysis.json", execution.analysis);
    logger.info(`Geracao enriquecida via provider: ${execution.aiResponse.provider}`);
    logger.info(`Versao de prompt aplicada: ${execution.promptResolution.selected.version}`);
    logger.info(`Origem do registry de prompt: ${execution.promptResolution.source}`);
    if (execution.promptResolution.source === "file") {
      logger.info(`Arquivo de registry: ${execution.promptResolution.filePath}`);
    }
    if (execution.promptResolution.fallbackApplied) {
      logger.warning(
        `Prompt version '${execution.promptResolution.requestedVersion}' nao encontrado. Fallback aplicado para '${execution.promptResolution.selected.version}'.`
      );
    }
    logger.info(`Modo de saida aplicado: ${execution.mode}`);
    logger.info(`Template aplicado: ${execution.template}`);
    logger.info("Geracao concluida.");
  }

  async generateForWeb(input: {
    text: string;
    mode?: OutputMode;
    template?: TemplateType;
    promptVersion?: string;
    outputFiles?: string[];
  }): Promise<WebGenerateResponse> {
    this.executionGuard.assertCanExecute();

    const execution = await this.executeGeneration({
      text: input.text,
      mode: input.mode,
      template: input.template,
      promptVersion: input.promptVersion,
      fallbackToLatest: false
    });

    const wantedFiles = new Set(input.outputFiles?.filter(Boolean));
    const selected = execution.files.filter((file) => {
      if (wantedFiles.size === 0) {
        return true;
      }
      return wantedFiles.has(file.fileName);
    });

    const files = selected.reduce<Record<string, string>>((acc, file) => {
      acc[file.fileName] = validateOutputSafety(file.content);
      return acc;
    }, {});

    return {
      files,
      metadata: {
        provider: execution.aiResponse.provider,
        mode: execution.mode,
        template: execution.template,
        promptVersion: execution.promptResolution.selected.version,
        promptRegistrySource: execution.promptResolution.source
      }
    };
  }

  async listPrompts(): Promise<void> {
    const registry = listPromptVersions();

    logger.info(`Origem do registry: ${registry.source}`);
    if (registry.source === "file") {
      logger.info(`Arquivo carregado: ${registry.filePath}`);
    } else {
      logger.warning(
        `Arquivo de registry nao encontrado/valido em '${registry.filePath}'. Usando versoes embutidas.`
      );
    }

    logger.info(`Versoes disponiveis: ${registry.versions.join(", ")}`);
  }

  private async executeGeneration(input: {
    target?: string;
    text?: string;
    mode?: OutputMode;
    template?: TemplateType;
    promptVersion?: string;
    fallbackToLatest: boolean;
  }): Promise<GenerateBundle> {
    const env = readEnv();
    const mode = input.mode ?? "technical";
    const template = input.template ?? "portfolio-project";
    const promptResolution = resolvePromptPack(input.promptVersion, env.DEFAULT_PROMPT_VERSION);

    const analysis = await this.inputAnalyzer.analyze({
      target: input.target,
      text: input.text,
      fallbackToLatest: input.fallbackToLatest
    });

    const aiResponse = await this.aiEngine.generate({
      systemPrompt: buildSystemPrompt(promptResolution.selected),
      userInput: buildUserPrompt(analysis, promptResolution.selected),
      maxTokens: 650
    });

    const files = this.projectGenerator.generateFromAnalysis(analysis, {
      aiBrief: aiResponse.content,
      aiProvider: aiResponse.provider,
      mode,
      template,
      promptVersion: promptResolution.selected.version
    });

    return {
      analysis,
      aiResponse,
      promptResolution,
      files,
      mode,
      template
    };
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

  async analyzeRepo(target?: string): Promise<void> {
    const result = await this.repoAnalyzer.analyze(target);
    const markdown = this.repoAnalyzer.buildMarkdownReport(result);

    await this.outputService.ensureBaseStructure();
    await this.outputService.writeJson("repo-analysis.json", result);
    await this.outputService.writeText("REPO_ANALYSIS.md", markdown);

    logger.info("Analise de repositorio concluida.");
    logger.info(`Score: ${result.score}/100`);
    logger.info("Arquivos gerados: outputs/repo-analysis.json e outputs/REPO_ANALYSIS.md");
  }

  async githubSync(repo?: string, publish = false): Promise<void> {
    let summary = "Sem analise recente.";
    try {
      const latest = await this.outputService.readJson<{ summary?: string }>("latest-analysis.json");
      summary = latest.summary ?? summary;
    } catch {
      // fallback silencioso para permitir sync mesmo sem latest-analysis
    }

    const issues = this.projectGenerator.buildIssuesSuggestions({
      theme: "Projeto de software",
      intent: "Evoluir backlog com foco em entrega",
      summary
    });

    const payload = this.githubIntegration.buildPayload({
      repository: repo,
      issues,
      latestSummary: summary
    });

    await this.outputService.ensureBaseStructure();
    await this.outputService.writeJson("github-sync-payload.json", payload);
    await this.outputService.writeText("PR_DESCRIPTION.md", payload.prDescription);
    await this.outputService.writeText("CHANGELOG_SUGGESTED.md", payload.changelog);

    if (!publish) {
      logger.info("GitHub sync em modo dry-run concluido.");
      logger.info("Arquivos gerados: github-sync-payload.json, PR_DESCRIPTION.md, CHANGELOG_SUGGESTED.md");
      return;
    }

    const publishResult = await this.githubIntegration.publishIssues(payload);
    await this.outputService.writeJson("github-sync-result.json", publishResult);

    logger.info("Issues publicadas no GitHub com sucesso.");
    logger.info(`Total de issues criadas: ${publishResult.createdIssues.length}`);
  }
}
