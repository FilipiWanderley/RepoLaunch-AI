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

export class ProjectGeneratorService {
  generateFromAnalysis(analysis: AnalysisResult): GeneratedFile[] {
    return [
      { fileName: "README.md", content: buildReadmeTemplate(analysis) },
      { fileName: "ARCHITECTURE.md", content: buildArchitectureTemplate(analysis) },
      { fileName: "ROADMAP.md", content: buildRoadmapTemplate(analysis) },
      { fileName: "PROJECT_PLAN.md", content: buildProjectPlanTemplate(analysis) },
      { fileName: "PORTFOLIO_PITCH.md", content: buildPortfolioPitchTemplate(analysis) }
    ];
  }
}
