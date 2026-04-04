#!/usr/bin/env node

import { config } from "dotenv";
import { createProgram } from "./cli/program";

config();

async function bootstrap(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  process.stderr.write(`[repolaunch] ${message}\n`);
  process.exit(1);
});
