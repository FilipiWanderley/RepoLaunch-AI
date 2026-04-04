import { Command } from "commander";
import { RepoLaunchController } from "../controllers/repolaunch-controller";

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
    .argument("[target]", "Caminho do arquivo ou pasta")
    .action(async (target: string | undefined, options: { text?: string }) =>
      controller.generate(target, options.text)
    );

  program
    .command("export")
    .description("Gera manifesto JSON com os outputs atuais")
    .action(async () => controller.exportOutputs());

  return program;
}
