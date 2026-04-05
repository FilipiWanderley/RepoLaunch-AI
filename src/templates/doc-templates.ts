import { AnalysisResult } from "../services/input-analyzer-service";
import { OutputMode, TemplateType } from "../types/output";

function templateLabel(template: TemplateType): string {
  if (template === "saas") {
    return "SaaS";
  }

  if (template === "cli-tool") {
    return "CLI Tool";
  }

  if (template === "ai-workflow") {
    return "AI Workflow";
  }

  return "Portfolio Project";
}

function templateFocus(template: TemplateType): string {
  if (template === "saas") {
    return "Foco em entrega de valor continuo, onboarding e retencao de usuarios.";
  }

  if (template === "cli-tool") {
    return "Foco em experiencia de comando, automacao e produtividade tecnica.";
  }

  if (template === "ai-workflow") {
    return "Foco em orquestracao de prompts, resiliencia de providers e qualidade de output.";
  }

  return "Foco em demonstracao de habilidades para portfolio e crescimento de carreira.";
}

function templateActions(template: TemplateType): string[] {
  if (template === "saas") {
    return [
      "- Definir problema de usuario e proposta de valor com clareza",
      "- Estruturar onboarding e primeira experiencia de uso",
      "- Priorizar metricas de ativacao e retencao"
    ];
  }

  if (template === "cli-tool") {
    return [
      "- Definir comandos principais e sintaxe consistente",
      "- Padronizar erros e feedback de execucao",
      "- Garantir performance e confiabilidade de automacao"
    ];
  }

  if (template === "ai-workflow") {
    return [
      "- Definir contratos de prompt e output",
      "- Implementar fallback e politicas de seguranca",
      "- Medir qualidade dos artefatos gerados"
    ];
  }

  return [
    "- Priorizar entregas com alto valor de portfolio",
    "- Evidenciar arquitetura, testes e boas praticas",
    "- Publicar com narrativa clara de impacto"
  ];
}

function modeLabel(mode: OutputMode): string {
  if (mode === "recruiter") {
    return "Recruiter";
  }

  if (mode === "simplified") {
    return "Simplified";
  }

  return "Technical";
}

function modeFocus(mode: OutputMode): string {
  if (mode === "recruiter") {
    return "Foco em impacto, lideranca tecnica, clareza de execucao e valor de negocio.";
  }

  if (mode === "simplified") {
    return "Foco em clareza, linguagem simples, passos curtos e baixo atrito para executar.";
  }

  return "Foco em arquitetura, engenharia, risco tecnico e decisoes de implementacao.";
}

function modeActionTitle(mode: OutputMode): string {
  if (mode === "recruiter") {
    return "Prioridades de impacto";
  }

  if (mode === "simplified") {
    return "Passos simples para comecar";
  }

  return "Prioridades tecnicas";
}

function modeActions(mode: OutputMode): string[] {
  if (mode === "recruiter") {
    return [
      "1. Entregar um MVP funcional que gere demonstracao clara de valor",
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
    "1. Validar escopo, fronteiras do dominio e contratos de entrada/saida",
    "2. Implementar MVP com cobertura de testes para fluxos criticos",
    "3. Medir qualidade de output e iterar em prompts/templates"
  ];
}

function modeRoadmapEmphasis(mode: OutputMode): string[] {
  if (mode === "recruiter") {
    return [
      "- Demonstrar valor de negocio em cada entrega",
      "- Produzir evidencias para portfolio e entrevistas"
    ];
  }

  if (mode === "simplified") {
    return [
      "- Dividir entregas em blocos curtos e testaveis",
      "- Priorizar o que desbloqueia execucao rapida"
    ];
  }

  return [
    "- Definir SLO de qualidade para documentos gerados",
    "- Evoluir arquitetura sem quebrar contratos publicos"
  ];
}

function modePlanRisks(mode: OutputMode): string[] {
  if (mode === "recruiter") {
    return [
      "- Narrativa fraca de impacto no portfolio",
      "- Falta de consistencia entre entrega tecnica e comunicacao"
    ];
  }

  if (mode === "simplified") {
    return [
      "- Escopo grande demais para o primeiro ciclo",
      "- Excesso de complexidade na documentacao inicial"
    ];
  }

  return [
    "- Prompt malformado",
    "- Input sem contexto suficiente",
    "- Regressao de qualidade em templates"
  ];
}

function modePitch(mode: OutputMode): string {
  if (mode === "recruiter") {
    return "Transformei aprendizado em um projeto com entrega objetiva, narrativa forte de impacto e sinais claros de senioridade tecnica.";
  }

  if (mode === "simplified") {
    return "Transformei estudo em um projeto pratico, com passos claros e documentos prontos para publicar sem complicacao.";
  }

  return "Transformei aprendizado em um projeto real com arquitetura em camadas, CLI profissional e foco em entrega rapida.";
}

function modeHighlights(mode: OutputMode): string[] {
  if (mode === "recruiter") {
    return [
      "- Comunicacao tecnica com linguagem de negocio",
      "- Evidencias de ownership e capacidade de entrega",
      "- Relevancia para portfolio e processo seletivo"
    ];
  }

  if (mode === "simplified") {
    return [
      "- Linguagem clara e acionavel",
      "- Sequencia simples para sair do zero",
      "- Foco em executar e publicar rapido"
    ];
  }

  return [
    "- Engenharia orientada a produto",
    "- Seguranca e padronizacao de output",
    "- Decisoes tecnicas explicitas"
  ];
}

function maybeAIBrief(aiBrief?: string, title = "Resumo estrategico de IA"): string[] {
  if (!aiBrief) {
    return [];
  }

  return ["", `## ${title}`, aiBrief.trim()];
}

export function buildReadmeTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType,
  aiBrief?: string,
  aiProvider?: string
): string {
  return [
    "# Projeto Gerado por RepoLaunch AI",
    "",
    "## Tema",
    analysis.theme,
    "",
    "## Intencao",
    analysis.intent,
    "",
    "## Modo",
    modeLabel(mode),
    "",
    "## Template",
    templateLabel(template),
    "",
    "## Foco",
    modeFocus(mode),
    "",
    "## Foco do template",
    templateFocus(template),
    "",
    "## Contexto",
    analysis.context,
    "",
    `## Provider de IA`,
    aiProvider ?? "mock",
    ...maybeAIBrief(aiBrief),
    "",
    "## Diretrizes do template",
    ...templateActions(template),
    "",
    `## ${modeActionTitle(mode)}`,
    ...modeActions(mode)
  ].join("\n");
}

export function buildArchitectureTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType,
  aiBrief?: string
): string {
  return [
    "# Architecture",
    "",
    "## Overview",
    "CLI -> Controllers -> Services -> AI Engine -> Templates -> Outputs",
    "",
    "## Alignment",
    `Tema principal: ${analysis.theme}`,
    `Direcao: ${analysis.intent}`,
    `Modo: ${modeLabel(mode)}`,
    `Template: ${templateLabel(template)}`,
    ...maybeAIBrief(aiBrief, "Recomendacoes de arquitetura")
  ].join("\n");
}

export function buildRoadmapTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType,
  aiBrief?: string
): string {
  return [
    "# Roadmap",
    "",
    `Modo de planejamento: ${modeLabel(mode)}`,
    `Template selecionado: ${templateLabel(template)}`,
    "",
    "## v1 (MVP)",
    "- Fluxo analyze",
    "- Fluxo generate",
    "- Outputs principais",
    ...templateActions(template),
    "",
    "## v2",
    "- Repo analyzer",
    "- Integracao com GitHub",
    ...modeRoadmapEmphasis(mode),
    "",
    "## Contexto de origem",
    analysis.summary,
    ...maybeAIBrief(aiBrief, "Notas de aceleracao")
  ].join("\n");
}

export function buildProjectPlanTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType,
  aiBrief?: string
): string {
  return [
    "# Project Plan",
    "",
    `Modo: ${modeLabel(mode)}`,
    `Template: ${templateLabel(template)}`,
    "",
    "## Objetivo",
    analysis.intent,
    "",
    "## Escopo inicial",
    "- Entrada de texto e arquivos",
    "- Analise semantica basica",
    "- Geracao de documentacao",
    "",
    "## Riscos",
    ...modePlanRisks(mode),
    "",
    "## Mitigacoes",
    "- Validacao de schema",
    "- Defaults seguros",
    ...maybeAIBrief(aiBrief, "Direcionamento tatico")
  ].join("\n");
}

export function buildPortfolioPitchTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType,
  aiBrief?: string
): string {
  return [
    "# Portfolio Pitch",
    "",
    `Modo: ${modeLabel(mode)}`,
    `Template: ${templateLabel(template)}`,
    "",
    modePitch(mode),
    "",
    "## Destaques",
    `- Tema: ${analysis.theme}`,
    ...modeHighlights(mode),
    "",
    "## Narrativa curta",
    analysis.summary,
    ...maybeAIBrief(aiBrief, "Narrativa complementar")
  ].join("\n");
}

export function buildIssuesSuggestionsTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  template: TemplateType
): string {
  return [
    "# Issues Suggestions",
    "",
    `Modo: ${modeLabel(mode)}`,
    `Template: ${templateLabel(template)}`,
    "",
    "## 1) feat: implementar pipeline base",
    `Tema: ${analysis.theme}`,
    `Objetivo: ${analysis.intent}`,
    "",
    "## 2) docs: elevar qualidade de templates",
    "Padronizar estrutura dos documentos para reuso e clareza.",
    "",
    "## 3) test: ampliar cobertura do fluxo CLI",
    "Cobrir analyze, generate e export com cenarios de seguranca."
  ].join("\n");
}
