import { Command } from "commander";
import { RepoLaunchController } from "../controllers/repolaunch-controller";
import { normalizeExportFormat, normalizeMode, normalizeTemplateType } from "../types/output";

export function createProgram(): Command {
  const controller = new RepoLaunchController();
  const program = new Command();

  program
    .name("repolaunch")
    .description("Transforme aprendizado em projeto pronto para execucao")
    .version("1.0.0");

  program
    .command("init")
    .description("Prepara estrutura minima de configuracao e output")
    .action(async () => controller.init());

  program
    .command("analyze")
    .description("Analisa texto, arquivo ou pasta")
    .argument("[target]", "Caminho do arquivo ou pasta")
    .option("-t, --text <text>", "Texto bruto para analise")
    .action(async (target: string | undefined, options: { text?: string }) =>
      controller.analyze(target, options.text)
    );

  program
    .command("generate")
    .description("Gera documentos principais do projeto")
    .option("-t, --text <text>", "Texto bruto de entrada")
    .option(
      "-m, --mode <mode>",
      "Modo de saida: technical | recruiter | simplified",
      "technical"
    )
    .option(
      "-p, --template <template>",
      "Template: portfolio-project | saas | cli-tool | ai-workflow",
      "portfolio-project"
    )
    .argument("[target]", "Caminho do arquivo ou pasta")
    .action(
      async (
        target: string | undefined,
        options: { text?: string; mode?: string; template?: string }
      ) =>
        controller.generate(
          target,
          options.text,
          normalizeMode(options.mode),
          normalizeTemplateType(options.template)
        )
    );

  program
    .command("export")
    .description("Gera manifesto JSON com os outputs atuais")
    .option("-f, --format <format>", "Formato: json | markdown | issues", "json")
    .action(async (options: { format?: string }) =>
      controller.exportOutputs(normalizeExportFormat(options.format))
    );

  program
    .command("repo-analyze")
    .description("Analisa um repositorio existente e gera diagnostico")
    .argument("[target]", "Caminho da raiz do repositorio")
    .action(async (target: string | undefined) => controller.analyzeRepo(target));

  return program;
}
