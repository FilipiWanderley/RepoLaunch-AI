import fs from "node:fs/promises";
import path from "node:path";
import { CliError } from "../errors/cli-error";

export type RepoFinding = {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  recommendation: string;
};

export type RepoAnalysisResult = {
  targetPath: string;
  generatedAt: string;
  score: number;
  summary: {
    hasReadme: boolean;
    hasTests: boolean;
    hasCI: boolean;
    hasDocs: boolean;
    hasEnvExample: boolean;
    srcFileCount: number;
  };
  findings: RepoFinding[];
  onboarding: string[];
};

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "outputs"]);

export class RepoAnalyzerService {
  async analyze(targetPath?: string): Promise<RepoAnalysisResult> {
    const resolvedTarget = path.resolve(targetPath ?? process.cwd());
    const stat = await this.safeStat(resolvedTarget);

    if (!stat.isDirectory()) {
      throw new CliError("O caminho informado para repo-analyze nao e uma pasta.", {
        code: "INVALID_REPO_TARGET",
        hint: "Informe a raiz de um repositorio local."
      });
    }

    const files = await this.walkFiles(resolvedTarget, resolvedTarget, 0, 5);
    const normalized = files.map((file) => file.replace(/\\/g, "/"));

    const hasReadme = normalized.some((file) => /(^|\/)README\.md$/i.test(file));
    const hasDocs = normalized.some((file) => file.startsWith("docs/"));
    const hasEnvExample = normalized.includes(".env.example");
    const hasCI = normalized.some((file) => file.startsWith(".github/workflows/") && file.endsWith(".yml"));
    const hasTests = normalized.some(
      (file) => file.startsWith("tests/") || file.endsWith(".test.ts") || file.endsWith(".spec.ts")
    );
    const srcFileCount = normalized.filter((file) => file.startsWith("src/") && file.endsWith(".ts")).length;

    const findings: RepoFinding[] = [];

    if (!hasReadme) {
      findings.push({
        severity: "high",
        title: "README principal ausente",
        detail: "Nao foi encontrado README.md na raiz.",
        recommendation: "Adicione um README com quick start, arquitetura e casos de uso."
      });
    }

    if (!hasTests) {
      findings.push({
        severity: "medium",
        title: "Cobertura de testes nao detectada",
        detail: "Nao encontramos pasta tests nem arquivos .test.ts/.spec.ts.",
        recommendation: "Inclua testes unitarios e de integracao para fluxos criticos."
      });
    }

    if (!hasCI) {
      findings.push({
        severity: "medium",
        title: "Pipeline de CI ausente",
        detail: "Nao foi detectado workflow em .github/workflows.",
        recommendation: "Crie pipeline com typecheck, testes e build em pull requests."
      });
    }

    if (!hasDocs) {
      findings.push({
        severity: "low",
        title: "Documentacao de apoio limitada",
        detail: "Nao foi detectada pasta docs com guias e exemplos.",
        recommendation: "Adicione docs de uso, exemplos e troubleshooting."
      });
    }

    if (!hasEnvExample) {
      findings.push({
        severity: "low",
        title: "Arquivo .env.example ausente",
        detail: "Nao encontramos .env.example na raiz.",
        recommendation: "Adicione .env.example com variaveis esperadas."
      });
    }

    if (srcFileCount < 5) {
      findings.push({
        severity: "low",
        title: "Base de codigo ainda enxuta",
        detail: `Apenas ${srcFileCount} arquivos TypeScript detectados em src/.`,
        recommendation: "Evolua modulos por camada para escalar funcionalidades do roadmap."
      });
    }

    const penalty = findings.reduce((acc, finding) => {
      if (finding.severity === "high") {
        return acc + 25;
      }
      if (finding.severity === "medium") {
        return acc + 15;
      }
      return acc + 8;
    }, 0);

    const score = Math.max(0, Math.min(100, 100 - penalty));

    const onboarding = [
      "Leia README.md para entender proposta e comandos principais.",
      "Execute npm run ci para validar qualidade local.",
      "Use repolaunch analyze e repolaunch generate para criar outputs iniciais.",
      "Revise outputs/ e abra uma issue para qualquer melhoria identificada."
    ];

    return {
      targetPath: resolvedTarget,
      generatedAt: new Date().toISOString(),
      score,
      summary: {
        hasReadme,
        hasTests,
        hasCI,
        hasDocs,
        hasEnvExample,
        srcFileCount
      },
      findings,
      onboarding
    };
  }

  buildMarkdownReport(result: RepoAnalysisResult): string {
    const summaryRows = [
      `- Score: ${result.score}/100`,
      `- README: ${result.summary.hasReadme ? "sim" : "nao"}`,
      `- Tests: ${result.summary.hasTests ? "sim" : "nao"}`,
      `- CI: ${result.summary.hasCI ? "sim" : "nao"}`,
      `- Docs: ${result.summary.hasDocs ? "sim" : "nao"}`,
      `- .env.example: ${result.summary.hasEnvExample ? "sim" : "nao"}`,
      `- Arquivos TS em src/: ${result.summary.srcFileCount}`
    ];

    const findings =
      result.findings.length === 0
        ? ["- Nenhum risco relevante identificado."]
        : result.findings.map(
            (finding, index) =>
              `${index + 1}. [${finding.severity}] ${finding.title}\n   - detalhe: ${finding.detail}\n   - recomendacao: ${finding.recommendation}`
          );

    return [
      "# Repo Analysis",
      "",
      `Target: ${result.targetPath}`,
      `Generated at: ${result.generatedAt}`,
      "",
      "## Summary",
      ...summaryRows,
      "",
      "## Findings",
      ...findings,
      "",
      "## Onboarding Suggestions",
      ...result.onboarding.map((step, index) => `${index + 1}. ${step}`)
    ].join("\n");
  }

  private async walkFiles(
    rootDir: string,
    currentDir: string,
    depth: number,
    maxDepth: number
  ): Promise<string[]> {
    if (depth > maxDepth) {
      return [];
    }

    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.walkFiles(rootDir, fullPath, depth + 1, maxDepth);
        files.push(...nested);
        continue;
      }

      files.push(path.relative(rootDir, fullPath));
    }

    return files;
  }

  private async safeStat(targetPath: string): Promise<Awaited<ReturnType<typeof fs.stat>>> {
    try {
      return await fs.stat(targetPath);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new CliError(`Repositorio nao encontrado: ${targetPath}`, {
          code: "REPO_NOT_FOUND",
          hint: "Informe um caminho valido para a raiz do repositorio."
        });
      }

      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ENOENT";
  }
}
