import { AnalysisResult } from "../services/input-analyzer-service";
import { OutputMode, TemplateType } from "../types/output";

type DocLanguage = "pt" | "en";

function t(language: DocLanguage, pt: string, en: string): string {
  return language === "en" ? en : pt;
}

function templateLabel(template: TemplateType, language: DocLanguage): string {
  if (template === "saas") return "SaaS";
  if (template === "cli-tool") return t(language, "Ferramenta CLI", "CLI Tool");
  if (template === "ai-workflow") return t(language, "Fluxo de IA", "AI Workflow");
  return t(language, "Projeto de Portfólio", "Portfolio Project");
}

function templateFocus(template: TemplateType, language: DocLanguage): string {
  if (language === "en") {
    if (template === "saas") return "Focus on continuous value delivery, onboarding and user retention.";
    if (template === "cli-tool") return "Focus on command UX, automation and technical productivity.";
    if (template === "ai-workflow") return "Focus on prompt orchestration, provider resilience and output quality.";
    return "Focus on portfolio evidence and career growth outcomes.";
  }

  if (template === "saas") return "Foco em entrega de valor contínuo, onboarding e retenção de usuários.";
  if (template === "cli-tool") return "Foco em experiência de comando, automação e produtividade técnica.";
  if (template === "ai-workflow") return "Foco em orquestração de prompts, resiliência de providers e qualidade de saída.";
  return "Foco em demonstração de habilidades para portfólio e crescimento de carreira.";
}

function templateActions(template: TemplateType, language: DocLanguage): string[] {
  if (language === "en") {
    if (template === "saas") {
      return [
        "- Define user problem and value proposition clearly",
        "- Structure onboarding and first-use experience",
        "- Prioritize activation and retention metrics"
      ];
    }
    if (template === "cli-tool") {
      return [
        "- Define core commands and consistent syntax",
        "- Standardize errors and execution feedback",
        "- Ensure automation performance and reliability"
      ];
    }
    if (template === "ai-workflow") {
      return [
        "- Define prompt and output contracts",
        "- Implement fallback and safety policies",
        "- Measure generated artifact quality"
      ];
    }
    return [
      "- Prioritize high-value portfolio deliveries",
      "- Show architecture, tests and engineering practices",
      "- Publish with a clear impact narrative"
    ];
  }

  if (template === "saas") {
    return [
      "- Definir problema de usuário e proposta de valor com clareza",
      "- Estruturar onboarding e primeira experiência de uso",
      "- Priorizar métricas de ativação e retenção"
    ];
  }
  if (template === "cli-tool") {
    return [
      "- Definir comandos principais e sintaxe consistente",
      "- Padronizar erros e feedback de execução",
      "- Garantir performance e confiabilidade da automação"
    ];
  }
  if (template === "ai-workflow") {
    return [
      "- Definir contratos de prompt e saída",
      "- Implementar fallback e políticas de segurança",
      "- Medir qualidade dos artefatos gerados"
    ];
  }
  return [
    "- Priorizar entregas com alto valor de portfólio",
    "- Evidenciar arquitetura, testes e boas práticas",
    "- Publicar com narrativa clara de impacto"
  ];
}

function modeLabel(mode: OutputMode, language: DocLanguage): string {
  if (mode === "recruiter") return t(language, "Recrutador", "Recruiter");
  if (mode === "simplified") return t(language, "Simplificado", "Simplified");
  return t(language, "Técnico", "Technical");
}

function modeFocus(mode: OutputMode, language: DocLanguage): string {
  if (language === "en") {
    if (mode === "recruiter") return "Focus on impact, technical leadership, execution clarity and business value.";
    if (mode === "simplified") return "Focus on clarity, simple language, short steps and low execution friction.";
    return "Focus on architecture, engineering quality, technical risks and implementation decisions.";
  }

  if (mode === "recruiter") return "Foco em impacto, liderança técnica, clareza de execução e valor de negócio.";
  if (mode === "simplified") return "Foco em clareza, linguagem simples, passos curtos e baixo atrito para executar.";
  return "Foco em arquitetura, engenharia, risco técnico e decisões de implementação.";
}

function modeActionTitle(mode: OutputMode, language: DocLanguage): string {
  if (language === "en") {
    if (mode === "recruiter") return "Impact priorities";
    if (mode === "simplified") return "Simple steps to start";
    return "Technical priorities";
  }

  if (mode === "recruiter") return "Prioridades de impacto";
  if (mode === "simplified") return "Passos simples para começar";
  return "Prioridades técnicas";
}

function modeActions(mode: OutputMode, language: DocLanguage): string[] {
  if (language === "en") {
    if (mode === "recruiter") {
      return [
        "1. Deliver a functional MVP with clear value demonstration",
        "2. Show productivity and quality gains in outputs",
        "3. Communicate outcomes with ownership and impact"
      ];
    }
    if (mode === "simplified") {
      return [
        "1. Pick a short and objective input",
        "2. Run generate to produce core documents",
        "3. Refine generated files and publish on GitHub"
      ];
    }
    return [
      "1. Validate scope, domain boundaries and input/output contracts",
      "2. Implement MVP with test coverage for critical paths",
      "3. Measure output quality and iterate prompts/templates"
    ];
  }

  if (mode === "recruiter") {
    return [
      "1. Entregar um MVP funcional com demonstração clara de valor",
      "2. Evidenciar ganhos de produtividade e qualidade nos outputs",
      "3. Comunicar resultado com narrativa de ownership e impacto"
    ];
  }
  if (mode === "simplified") {
    return [
      "1. Escolher um input curto e objetivo",
      "2. Rodar generate para produzir os documentos principais",
      "3. Ajustar os arquivos gerados e publicar no GitHub"
    ];
  }
  return [
    "1. Validar escopo, fronteiras do domínio e contratos de entrada/saída",
    "2. Implementar MVP com cobertura de testes para fluxos críticos",
    "3. Medir qualidade de saída e iterar em prompts/templates"
  ];
}

function modeRoadmapEmphasis(mode: OutputMode, language: DocLanguage): string[] {
  if (language === "en") {
    if (mode === "recruiter") return ["- Demonstrate business value in each delivery", "- Produce portfolio and interview-ready evidence"];
    if (mode === "simplified") return ["- Split deliveries into short testable blocks", "- Prioritize what unlocks fast execution"];
    return ["- Define quality SLOs for generated documents", "- Evolve architecture without breaking public contracts"];
  }

  if (mode === "recruiter") return ["- Demonstrar valor de negócio em cada entrega", "- Produzir evidências para portfólio e entrevistas"];
  if (mode === "simplified") return ["- Dividir entregas em blocos curtos e testáveis", "- Priorizar o que desbloqueia execução rápida"];
  return ["- Definir SLO de qualidade para documentos gerados", "- Evoluir arquitetura sem quebrar contratos públicos"];
}

function modePlanRisks(mode: OutputMode, language: DocLanguage): string[] {
  if (language === "en") {
    if (mode === "recruiter") return ["- Weak impact narrative in portfolio", "- Inconsistency between technical delivery and communication"];
    if (mode === "simplified") return ["- Scope too large for first cycle", "- Excessive complexity in initial documentation"];
    return ["- Malformed prompt", "- Input without enough context", "- Template quality regression"];
  }

  if (mode === "recruiter") return ["- Narrativa fraca de impacto no portfólio", "- Falta de consistência entre entrega técnica e comunicação"];
  if (mode === "simplified") return ["- Escopo grande demais para o primeiro ciclo", "- Excesso de complexidade na documentação inicial"];
  return ["- Prompt malformado", "- Input sem contexto suficiente", "- Regressão de qualidade em templates"];
}

function modePitch(mode: OutputMode, language: DocLanguage): string {
  if (language === "en") {
    if (mode === "recruiter") return "I turned learning into a project with objective delivery, strong impact narrative and clear senior engineering signals.";
    if (mode === "simplified") return "I turned study into a practical project, with clear steps and publish-ready documents without complexity.";
    return "I turned learning into a real project with layered architecture, professional CLI and fast delivery focus.";
  }

  if (mode === "recruiter") return "Transformei aprendizado em um projeto com entrega objetiva, narrativa forte de impacto e sinais claros de senioridade técnica.";
  if (mode === "simplified") return "Transformei estudo em um projeto prático, com passos claros e documentos prontos para publicar sem complicação.";
  return "Transformei aprendizado em um projeto real com arquitetura em camadas, CLI profissional e foco em entrega rápida.";
}

function modeHighlights(mode: OutputMode, language: DocLanguage): string[] {
  if (language === "en") {
    if (mode === "recruiter") {
      return [
        "- Technical communication with business language",
        "- Ownership and delivery capability evidence",
        "- Portfolio and hiring relevance"
      ];
    }
    if (mode === "simplified") {
      return [
        "- Clear and actionable language",
        "- Simple sequence to start from zero",
        "- Focus on execution and fast publishing"
      ];
    }
    return [
      "- Product-minded engineering",
      "- Security and output standardization",
      "- Explicit technical decisions"
    ];
  }

  if (mode === "recruiter") {
    return [
      "- Comunicação técnica com linguagem de negócio",
      "- Evidências de ownership e capacidade de entrega",
      "- Relevância para portfólio e processo seletivo"
    ];
  }
  if (mode === "simplified") {
    return [
      "- Linguagem clara e acionável",
      "- Sequência simples para sair do zero",
      "- Foco em executar e publicar rápido"
    ];
  }
  return [
    "- Engenharia orientada a produto",
    "- Segurança e padronização de saída",
    "- Decisões técnicas explícitas"
  ];
}

function maybeAIBrief(aiBrief: string | undefined, language: DocLanguage, titlePt: string, titleEn: string): string[] {
  if (!aiBrief) return [];
  return ["", `## ${language === "en" ? titleEn : titlePt}`, aiBrief.trim()];
}

export function buildReadmeTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType,
  aiBrief?: string,
  aiProvider?: string,
  promptVersion?: string
): string {
  return [
    t(language, "# Projeto Gerado por RepoLaunch AI", "# Project Generated by RepoLaunch AI"),
    "",
    t(language, "## Tema", "## Theme"),
    analysis.theme,
    "",
    t(language, "## Intenção", "## Intent"),
    analysis.intent,
    "",
    t(language, "## Modo", "## Mode"),
    modeLabel(mode, language),
    "",
    "## Template",
    templateLabel(template, language),
    "",
    t(language, "## Versão do prompt", "## Prompt version"),
    promptVersion ?? "v1",
    "",
    t(language, "## Foco", "## Focus"),
    modeFocus(mode, language),
    "",
    t(language, "## Foco do template", "## Template focus"),
    templateFocus(template, language),
    "",
    t(language, "## Contexto", "## Context"),
    analysis.context,
    "",
    t(language, "## Provedor de IA", "## AI Provider"),
    aiProvider ?? "mock",
    ...maybeAIBrief(aiBrief, language, "Resumo estratégico de IA", "AI strategic brief"),
    "",
    t(language, "## Diretrizes do template", "## Template guidelines"),
    ...templateActions(template, language),
    "",
    `## ${modeActionTitle(mode, language)}`,
    ...modeActions(mode, language)
  ].join("\n");
}

export function buildArchitectureTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType,
  aiBrief?: string,
  promptVersion?: string
): string {
  return [
    t(language, "# Arquitetura", "# Architecture"),
    "",
    t(language, "## Visão geral", "## Overview"),
    "CLI -> Controllers -> Services -> AI Engine -> Templates -> Outputs",
    "",
    t(language, "## Alinhamento", "## Alignment"),
    `${t(language, "Tema principal", "Main theme")}: ${analysis.theme}`,
    `${t(language, "Direção", "Direction")}: ${analysis.intent}`,
    `${t(language, "Modo", "Mode")}: ${modeLabel(mode, language)}`,
    `Template: ${templateLabel(template, language)}`,
    `${t(language, "Versão do prompt", "Prompt version")}: ${promptVersion ?? "v1"}`,
    ...maybeAIBrief(aiBrief, language, "Recomendações de arquitetura", "Architecture recommendations")
  ].join("\n");
}

export function buildRoadmapTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType,
  aiBrief?: string,
  promptVersion?: string
): string {
  return [
    t(language, "# Roteiro", "# Roadmap"),
    "",
    `${t(language, "Modo de planejamento", "Planning mode")}: ${modeLabel(mode, language)}`,
    `${t(language, "Template selecionado", "Selected template")}: ${templateLabel(template, language)}`,
    `${t(language, "Versão do prompt", "Prompt version")}: ${promptVersion ?? "v1"}`,
    "",
    "## v1 (MVP)",
    t(language, "- Fluxo analyze", "- analyze flow"),
    t(language, "- Fluxo generate", "- generate flow"),
    t(language, "- Outputs principais", "- Core outputs"),
    ...templateActions(template, language),
    "",
    "## v2",
    t(language, "- Analisador de repositório", "- Repo analyzer"),
    t(language, "- Integração com GitHub", "- GitHub integration"),
    ...modeRoadmapEmphasis(mode, language),
    "",
    t(language, "## Contexto de origem", "## Source context"),
    analysis.summary,
    ...maybeAIBrief(aiBrief, language, "Notas de aceleração", "Acceleration notes")
  ].join("\n");
}

export function buildProjectPlanTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType,
  aiBrief?: string,
  promptVersion?: string
): string {
  return [
    t(language, "# Plano do Projeto", "# Project Plan"),
    "",
    `${t(language, "Modo", "Mode")}: ${modeLabel(mode, language)}`,
    `Template: ${templateLabel(template, language)}`,
    `${t(language, "Versão do prompt", "Prompt version")}: ${promptVersion ?? "v1"}`,
    "",
    t(language, "## Objetivo", "## Goal"),
    analysis.intent,
    "",
    t(language, "## Escopo inicial", "## Initial scope"),
    t(language, "- Entrada de texto e arquivos", "- Text and file input"),
    t(language, "- Análise semântica básica", "- Basic semantic analysis"),
    t(language, "- Geração de documentação", "- Documentation generation"),
    "",
    t(language, "## Riscos", "## Risks"),
    ...modePlanRisks(mode, language),
    "",
    t(language, "## Mitigações", "## Mitigations"),
    t(language, "- Validação de schema", "- Schema validation"),
    t(language, "- Defaults seguros", "- Safe defaults"),
    ...maybeAIBrief(aiBrief, language, "Direcionamento tático", "Tactical guidance")
  ].join("\n");
}

export function buildPortfolioPitchTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType,
  aiBrief?: string
): string {
  return [
    t(language, "# Pitch de Portfólio", "# Portfolio Pitch"),
    "",
    `${t(language, "Modo", "Mode")}: ${modeLabel(mode, language)}`,
    `Template: ${templateLabel(template, language)}`,
    "",
    modePitch(mode, language),
    "",
    t(language, "## Destaques", "## Highlights"),
    `${t(language, "- Tema", "- Theme")}: ${analysis.theme}`,
    ...modeHighlights(mode, language),
    "",
    t(language, "## Narrativa curta", "## Short narrative"),
    analysis.summary,
    ...maybeAIBrief(aiBrief, language, "Narrativa complementar", "Complementary narrative")
  ].join("\n");
}

export function buildIssuesSuggestionsTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  language: DocLanguage,
  template: TemplateType
): string {
  return [
    t(language, "# Sugestões de Issues", "# Issues Suggestions"),
    "",
    `${t(language, "Modo", "Mode")}: ${modeLabel(mode, language)}`,
    `Template: ${templateLabel(template, language)}`,
    "",
    t(language, "## 1) feat: implementar pipeline base", "## 1) feat: implement base pipeline"),
    `${t(language, "Tema", "Theme")}: ${analysis.theme}`,
    `${t(language, "Objetivo", "Goal")}: ${analysis.intent}`,
    "",
    t(language, "## 2) docs: elevar qualidade de templates", "## 2) docs: improve template quality"),
    t(language, "Padronizar estrutura dos documentos para reuso e clareza.", "Standardize document structure for reuse and clarity."),
    "",
    t(language, "## 3) test: ampliar cobertura do fluxo CLI", "## 3) test: expand CLI flow coverage"),
    t(language, "Cobrir analyze, generate e export com cenários de segurança.", "Cover analyze, generate and export with security scenarios.")
  ].join("\n");
}
