import { AnalysisResult } from "../services/input-analyzer-service";

export function buildReadmeTemplate(analysis: AnalysisResult): string {
  return [
    "# Projeto Gerado por RepoLaunch AI",
    "",
    `## Tema`,
    analysis.theme,
    "",
    "## Intencao",
    analysis.intent,
    "",
    "## Contexto",
    analysis.context,
    "",
    "## Proximos Passos",
    "1. Validar escopo",
    "2. Implementar MVP",
    "3. Publicar e coletar feedback"
  ].join("\n");
}

export function buildArchitectureTemplate(analysis: AnalysisResult): string {
  return [
    "# Architecture",
    "",
    "## Overview",
    "CLI -> Controllers -> Services -> AI Engine -> Templates -> Outputs",
    "",
    "## Alignment",
    `Tema principal: ${analysis.theme}`,
    `Direcao: ${analysis.intent}`
  ].join("\n");
}

export function buildRoadmapTemplate(analysis: AnalysisResult): string {
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
    analysis.summary
  ].join("\n");
}

export function buildProjectPlanTemplate(analysis: AnalysisResult): string {
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
    "- Defaults seguros"
  ].join("\n");
}

export function buildPortfolioPitchTemplate(analysis: AnalysisResult): string {
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
    analysis.summary
  ].join("\n");
}
