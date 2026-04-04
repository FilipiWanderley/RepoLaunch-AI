import { AnalysisResult } from "../services/input-analyzer-service";

function maybeAIBrief(aiBrief?: string, title = "Resumo estrategico de IA"): string[] {
  if (!aiBrief) {
    return [];
  }

  return ["", `## ${title}`, aiBrief.trim()];
}

export function buildReadmeTemplate(
  analysis: AnalysisResult,
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

export function buildArchitectureTemplate(analysis: AnalysisResult, aiBrief?: string): string {
  return [
    "# Architecture",
    "",
    "## Overview",
    "CLI -> Controllers -> Services -> AI Engine -> Templates -> Outputs",
    "",
    "## Alignment",
    `Tema principal: ${analysis.theme}`,
    `Direcao: ${analysis.intent}`,
    ...maybeAIBrief(aiBrief, "Recomendacoes de arquitetura")
  ].join("\n");
}

export function buildRoadmapTemplate(analysis: AnalysisResult, aiBrief?: string): string {
  return [
    "# Roadmap",
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

export function buildProjectPlanTemplate(analysis: AnalysisResult, aiBrief?: string): string {
  return [
    "# Project Plan",
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

export function buildPortfolioPitchTemplate(analysis: AnalysisResult, aiBrief?: string): string {
  return [
    "# Portfolio Pitch",
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
