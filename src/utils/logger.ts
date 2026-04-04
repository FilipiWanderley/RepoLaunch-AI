import { readEnv } from "../config/env";

type LogLevel = "debug" | "info" | "warning" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warning: 30,
  error: 40
};

type LogMeta = Record<string, unknown>;

function canLog(level: LogLevel): boolean {
  const envLevel = readEnv().LOG_LEVEL;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[envLevel];
}

function formatMeta(meta?: LogMeta): string {
  if (!meta) {
    return "";
  }

  return ` ${JSON.stringify(meta)}`;
}

function write(level: LogLevel, message: string, context = "app", meta?: LogMeta): void {
  if (!canLog(level)) {
    return;
  }

  const now = new Date().toISOString();
  process.stdout.write(`[${now}] [${level}] [${context}] ${message}${formatMeta(meta)}\n`);
}

function createLogger(context = "app") {
  return {
    debug: (message: string, meta?: LogMeta) => write("debug", message, context, meta),
    info: (message: string, meta?: LogMeta) => write("info", message, context, meta),
    warning: (message: string, meta?: LogMeta) => write("warning", message, context, meta),
    error: (message: string, meta?: LogMeta) => write("error", message, context, meta),
    child: (childContext: string) => createLogger(`${context}:${childContext}`)
  };
}

export const logger = createLogger();
