export class CliError extends Error {
  readonly code: string;
  readonly hint?: string;
  readonly exitCode: number;

  constructor(message: string, options: { code: string; hint?: string; exitCode?: number }) {
    super(message);
    this.name = "CliError";
    this.code = options.code;
    this.hint = options.hint;
    this.exitCode = options.exitCode ?? 1;
  }
}

export function normalizeCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message, {
      code: "UNEXPECTED_ERROR",
      hint: "Tente novamente com --help ou revise os parametros do comando.",
      exitCode: 1
    });
  }

  return new CliError("Erro inesperado", {
    code: "UNKNOWN_ERROR",
    hint: "Tente novamente com --help.",
    exitCode: 1
  });
}
