import { readEnv } from "../config/env";
import { CliError } from "../errors/cli-error";

export type GithubIssuePayload = {
  title: string;
  body: string;
  labels: string[];
};

export type GithubIntegrationPayload = {
  repository: string;
  generatedAt: string;
  issues: GithubIssuePayload[];
  prDescription: string;
  changelog: string;
};

export type GithubPublishResult = {
  published: boolean;
  createdIssues: Array<{ number: number; url: string; title: string }>;
};

export class GithubIntegrationService {
  buildPayload(input: {
    repository?: string;
    issues: GithubIssuePayload[];
    latestSummary?: string;
  }): GithubIntegrationPayload {
    const env = readEnv();
    const repository = input.repository ?? env.GITHUB_REPO ?? "owner/repository";
    const summary = input.latestSummary ?? "Sem resumo recente de analise.";

    const prDescription = [
      "## Contexto",
      summary,
      "",
      "## O que foi feito",
      "- Geracao de documentacao estruturada via RepoLaunch AI",
      "- Revisao da arquitetura e plano de execucao",
      "- Preparacao de backlog inicial em issues",
      "",
      "## Checklist",
      "- [x] Typecheck",
      "- [x] Testes",
      "- [x] Build",
      "- [ ] Review final de produto"
    ].join("\n");

    const changelog = [
      "# Changelog Suggestion",
      "",
      "## Added",
      "- Integracao GitHub com geracao de issues payload",
      "- Geracao automatica de PR description",
      "- Geracao de changelog sugerido",
      "",
      "## Improved",
      "- Fluxo de produtividade para publicacao de roadmap",
      "- Qualidade de onboarding para contribuidores"
    ].join("\n");

    return {
      repository,
      generatedAt: new Date().toISOString(),
      issues: input.issues,
      prDescription,
      changelog
    };
  }

  async publishIssues(payload: GithubIntegrationPayload): Promise<GithubPublishResult> {
    const env = readEnv();
    const token = env.GITHUB_TOKEN;

    if (!token) {
      throw new CliError("GITHUB_TOKEN nao configurado para publicar issues.", {
        code: "GITHUB_TOKEN_MISSING",
        hint: "Defina GITHUB_TOKEN no .env ou rode sem --publish para modo dry-run."
      });
    }

    const repo = payload.repository;
    if (!/^.+\/.+$/.test(repo)) {
      throw new CliError("Repositorio GitHub invalido.", {
        code: "GITHUB_REPO_INVALID",
        hint: "Use formato owner/repo, ex: FilipiWanderley/RepoLaunch-AI"
      });
    }

    const [owner, name] = repo.split("/");
    const createdIssues: Array<{ number: number; url: string; title: string }> = [];

    for (const issue of payload.issues) {
      const response = await fetch(`https://api.github.com/repos/${owner}/${name}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: issue.title,
          body: issue.body,
          labels: issue.labels
        })
      });

      if (!response.ok) {
        throw new CliError(`Falha ao publicar issue no GitHub (HTTP ${response.status}).`, {
          code: "GITHUB_ISSUE_CREATE_FAILED",
          hint: "Verifique permissao do token e nome do repositorio."
        });
      }

      const data = (await response.json()) as { number: number; html_url: string; title: string };
      createdIssues.push({
        number: data.number,
        url: data.html_url,
        title: data.title
      });
    }

    return {
      published: true,
      createdIssues
    };
  }
}
