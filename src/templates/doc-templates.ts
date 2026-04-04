import { AnalysisResult } from "../services/input-analyzer-service";
import { OutputMode } from "../types/output";

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
    return "Foco em impacto, lideranca tecnica e valor de negocio.";
  }

  if (mode === "simplified") {
    return "Foco em clareza, linguagem simples e passos curtos de execucao.";
  }

  return "Foco em arquitetura, engenharia e decisoes tecnicas.";
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
    "## Foco",
    modeFocus(mode),
    "",
    "## Contexto",
    analysis.context,
    "",
    `## Provider de IA`,
    aiProvider ?? "mock",
    ...maybeAIBrief(aiBrief),
    "",
    "## Proximos passos",
    "1. Validar escopo",
    "2. Implementar MVP",
    "3. Publicar e coletar feedback"
  ].join("\n");
}

export function buildArchitectureTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
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
    ...maybeAIBrief(aiBrief, "Recomendacoes de arquitetura")
  ].join("\n");
}

export function buildRoadmapTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  aiBrief?: string
): string {
  return [
    "# Roadmap",
    "",
    `Modo de planejamento: ${modeLabel(mode)}`,
    "",
    "## v1 (MVP)",
    "- Fluxo analyze",
    "- Fluxo generate",
    "- Outputs principais",
    "",
    "## v2",
    "- Repo analyzer",
    "- Integracao com GitHub",
    "",
    "## Contexto de origem",
    analysis.summary,
    ...maybeAIBrief(aiBrief, "Notas de aceleracao")
  ].join("\n");
}

export function buildProjectPlanTemplate(
  analysis: AnalysisResult,
  mode: OutputMode,
  aiBrief?: string
): string {
  return [
    "# Project Plan",
    "",
    `Modo: ${modeLabel(mode)}`,
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
    "- Prompt malformado",
    "- Input sem contexto suficiente",
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
  aiBrief?: string
): string {
  return [
    "# Portfolio Pitch",
    "",
    `Modo: ${modeLabel(mode)}`,
    "",
    "Transformei aprendizado em um projeto real com arquitetura em camadas, CLI profissional e foco em entrega rapida.",
    "",
    "## Destaques",
    `- Tema: ${analysis.theme}`,
    "- Engenharia orientada a produto",
    "- Seguranca e padronizacao de output",
    "",
    "## Narrativa curta",
    analysis.summary,
    ...maybeAIBrief(aiBrief, "Narrativa complementar")
  ].join("\n");
}

export function buildIssuesSuggestionsTemplate(analysis: AnalysisResult, mode: OutputMode): string {
  return [
    "# Issues Suggestions",
    "",
    `Modo: ${modeLabel(mode)}`,
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
