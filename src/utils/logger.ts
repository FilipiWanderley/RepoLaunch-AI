type LogLevel = "info" | "warning" | "error";

function write(level: LogLevel, message: string): void {
  const now = new Date().toISOString();
  process.stdout.write(`[${now}] [${level}] ${message}\n`);
}

export const logger = {
  info: (message: string) => write("info", message),
  warning: (message: string) => write("warning", message),
  error: (message: string) => write("error", message)
};
