import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProgram } from "../src/cli/program";
import { CliError } from "../src/errors/cli-error";

async function runCli(args: string[]): Promise<void> {
  const program = createProgram();
  await program.parseAsync(["node", "repolaunch", ...args]);
}

describe("CLI integration", () => {
  const originalCwd = process.cwd();
  let workspaceDir = "";

  beforeEach(async () => {
    workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "repolaunch-cli-"));
    process.chdir(workspaceDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(workspaceDir, { recursive: true, force: true });
  });

  it("deve executar fluxo end-to-end com export em markdown", async () => {
    await runCli(["init"]);
    await runCli(["analyze", "--text", "Fiz curso de IA e quero montar projeto para portfolio"]);
    await runCli(["generate", "--mode", "technical"]);
    await runCli(["export", "--format", "markdown"]);

    await expect(fs.stat(path.join(workspaceDir, "outputs", "README.md"))).resolves.toBeTruthy();
    await expect(
      fs.stat(path.join(workspaceDir, "outputs", "ISSUES_SUGGESTIONS.md"))
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(path.join(workspaceDir, "outputs", "export-manifest.md"))
    ).resolves.toBeTruthy();
  });

  it("deve gerar export de issues em JSON e refletir modo recruiter no README", async () => {
    await runCli([
      "generate",
      "--mode",
      "recruiter",
      "--text",
      "Quero um projeto para chamar atencao de recrutadores"
    ]);
    await runCli(["export", "--format", "issues"]);

    const readme = await fs.readFile(path.join(workspaceDir, "outputs", "README.md"), "utf8");
    const issuesRaw = await fs.readFile(path.join(workspaceDir, "outputs", "github-issues.json"), "utf8");
    const issues = JSON.parse(issuesRaw) as Array<{ title: string; labels: string[] }>;

    expect(readme).toContain("## Modo");
    expect(readme).toContain("Recruiter");
    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(issues[0]?.title).toContain("feat:");
    expect(issues[0]?.labels).toContain("mvp");
  });

  it("deve aplicar template saas nos documentos gerados", async () => {
    await runCli([
      "generate",
      "--mode",
      "technical",
      "--template",
      "saas",
      "--text",
      "Quero criar um SaaS de produtividade com onboarding forte"
    ]);

    const readme = await fs.readFile(path.join(workspaceDir, "outputs", "README.md"), "utf8");
    expect(readme).toContain("## Template");
    expect(readme).toContain("SaaS");
    expect(readme).toContain("onboarding");
  });

  it("deve retornar erro orientado a acao ao gerar sem analise previa", async () => {
    await expect(runCli(["generate"])).rejects.toMatchObject<CliError>({
      message: "Nenhuma analise previa encontrada.",
      code: "ANALYSIS_NOT_FOUND"
    });
  });

  it("deve retornar erro claro para caminho inexistente no analyze", async () => {
    await expect(runCli(["analyze", "./arquivo-inexistente.md"])).rejects.toMatchObject<CliError>({
      code: "TARGET_NOT_FOUND"
    });
  });

  it("deve gerar relatorio de repo-analyze em json e markdown", async () => {
    await runCli(["init"]);
    await runCli(["repo-analyze"]);

    const reportJsonRaw = await fs.readFile(path.join(workspaceDir, "outputs", "repo-analysis.json"), "utf8");
    const reportMd = await fs.readFile(path.join(workspaceDir, "outputs", "REPO_ANALYSIS.md"), "utf8");

    const reportJson = JSON.parse(reportJsonRaw) as { score: number; summary: { hasReadme: boolean } };
    expect(reportJson.score).toBeGreaterThanOrEqual(0);
    expect(reportJson.score).toBeLessThanOrEqual(100);
    expect(reportMd).toContain("# Repo Analysis");
    expect(reportMd).toContain("## Findings");
  });

  it("deve gerar artefatos de github-sync em modo dry-run", async () => {
    await runCli(["analyze", "--text", "Quero evoluir backlog com foco em entrega e qualidade"]);
    await runCli(["github-sync", "--repo", "FilipiWanderley/RepoLaunch-AI"]);

    await expect(
      fs.stat(path.join(workspaceDir, "outputs", "github-sync-payload.json"))
    ).resolves.toBeTruthy();
    await expect(fs.stat(path.join(workspaceDir, "outputs", "PR_DESCRIPTION.md"))).resolves.toBeTruthy();
    await expect(
      fs.stat(path.join(workspaceDir, "outputs", "CHANGELOG_SUGGESTED.md"))
    ).resolves.toBeTruthy();
  });
});
