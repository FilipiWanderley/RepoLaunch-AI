import { AnalysisResult } from "./input-analyzer-service";
import {
  buildArchitectureTemplate,
  buildPortfolioPitchTemplate,
  buildProjectPlanTemplate,
  buildReadmeTemplate,
  buildRoadmapTemplate
} from "../templates/doc-templates";

export type GeneratedFile = {
  fileName: string;
  content: string;
};

type GenerateOptions = {
  aiBrief?: string;
  aiProvider?: string;
};

export class ProjectGeneratorService {
  generateFromAnalysis(analysis: AnalysisResult, options: GenerateOptions = {}): GeneratedFile[] {
    return [
      {
        fileName: "README.md",
        content: buildReadmeTemplate(analysis, options.aiBrief, options.aiProvider)
      },
      {
        fileName: "ARCHITECTURE.md",
        content: buildArchitectureTemplate(analysis, options.aiBrief)
      },
      { fileName: "ROADMAP.md", content: buildRoadmapTemplate(analysis, options.aiBrief) },
      {
        fileName: "PROJECT_PLAN.md",
        content: buildProjectPlanTemplate(analysis, options.aiBrief)
      },
      {
        fileName: "PORTFOLIO_PITCH.md",
        content: buildPortfolioPitchTemplate(analysis, options.aiBrief)
      }
    ];
  }
}
