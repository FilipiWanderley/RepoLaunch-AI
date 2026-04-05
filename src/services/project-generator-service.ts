import { AnalysisResult } from "./input-analyzer-service";
import {
  buildArchitectureTemplate,
  buildIssuesSuggestionsTemplate,
  buildPortfolioPitchTemplate,
  buildProjectPlanTemplate,
  buildReadmeTemplate,
  buildRoadmapTemplate
} from "../templates/doc-templates";
import { OutputMode, TemplateType } from "../types/output";

export type GeneratedFile = {
  fileName: string;
  content: string;
};

type GenerateOptions = {
  aiBrief?: string;
  aiProvider?: string;
  mode?: OutputMode;
  template?: TemplateType;
};

export class ProjectGeneratorService {
  generateFromAnalysis(analysis: AnalysisResult, options: GenerateOptions = {}): GeneratedFile[] {
    const mode = options.mode ?? "technical";
    const template = options.template ?? "portfolio-project";

    return [
      {
        fileName: "README.md",
        content: buildReadmeTemplate(analysis, mode, template, options.aiBrief, options.aiProvider)
      },
      {
        fileName: "ARCHITECTURE.md",
        content: buildArchitectureTemplate(analysis, mode, template, options.aiBrief)
      },
      {
        fileName: "ROADMAP.md",
        content: buildRoadmapTemplate(analysis, mode, template, options.aiBrief)
      },
      {
        fileName: "PROJECT_PLAN.md",
        content: buildProjectPlanTemplate(analysis, mode, template, options.aiBrief)
      },
      {
        fileName: "PORTFOLIO_PITCH.md",
        content: buildPortfolioPitchTemplate(analysis, mode, template, options.aiBrief)
      },
      {
        fileName: "ISSUES_SUGGESTIONS.md",
        content: buildIssuesSuggestionsTemplate(analysis, mode, template)
      }
    ];
  }

  buildMarkdownManifest(files: string[]): string {
    return [
      "# Export Manifest",
      "",
      `Gerado em: ${new Date().toISOString()}`,
      "",
      ...files.map((file) => `- ${file}`)
    ].join("\n");
  }

  buildIssuesSuggestions(analysis: { theme: string; intent: string; summary: string }): Array<{
    title: string;
    body: string;
    labels: string[];
  }> {
    return [
      {
        title: `feat: implementar pipeline base para ${analysis.theme}`,
        body: `Objetivo: ${analysis.intent}\n\nContexto:\n${analysis.summary}`,
        labels: ["enhancement", "mvp"]
      },
      {
        title: "docs: elevar qualidade dos templates gerados",
        body: "Melhorar clareza, consistencia e capacidade de reuso dos outputs markdown.",
        labels: ["documentation"]
      },
      {
        title: "test: ampliar cobertura para fluxo analyze/generate/export",
        body: "Adicionar testes de integracao da CLI e cenarios de seguranca.",
        labels: ["testing", "quality"]
      }
    ];
  }
}
