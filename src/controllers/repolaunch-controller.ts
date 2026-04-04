import path from "node:path";
import { InputAnalyzerService } from "../services/input-analyzer-service";
import { ProjectGeneratorService } from "../services/project-generator-service";
import { OutputService } from "../services/output-service";
import { logger } from "../utils/logger";

export class RepoLaunchController {
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

  async generate(target?: string, text?: string): Promise<void> {
    const analysis = await this.inputAnalyzer.analyze({ target, text, fallbackToLatest: true });
    const files = this.projectGenerator.generateFromAnalysis(analysis);

    await this.outputService.ensureBaseStructure();
    for (const file of files) {
      await this.outputService.writeText(file.fileName, file.content);
      logger.info(`Gerado: ${path.join("outputs", file.fileName)}`);
    }

    await this.outputService.writeJson("latest-analysis.json", analysis);
    logger.info("Geracao concluida.");
  }

  async exportOutputs(): Promise<void> {
    const manifest = await this.outputService.buildManifest();
    await this.outputService.writeJson("export-manifest.json", manifest);
    logger.info("Manifesto exportado para outputs/export-manifest.json");
  }
}
