#!/usr/bin/env node

import { config } from "dotenv";
import { createProgram } from "./cli/program";
import { normalizeCliError } from "./errors/cli-error";

config();

async function bootstrap(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

bootstrap().catch((error: unknown) => {
  const cliError = normalizeCliError(error);
  process.stderr.write(`[repolaunch] ${cliError.message}\n`);
  process.stderr.write(`[repolaunch] codigo: ${cliError.code}\n`);
  if (cliError.hint) {
    process.stderr.write(`[repolaunch] dica: ${cliError.hint}\n`);
  }
  process.exit(cliError.exitCode);
});
