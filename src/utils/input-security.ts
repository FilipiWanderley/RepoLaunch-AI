const MAX_INPUT_CHARS = 20_000;

const BLOCK_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/gi,
  /reveal\s+system\s+prompt/gi,
  /exfiltrate|leak\s+secret|api\s*key/gi
];

const REDACTION = "[conteudo_sensivel_redigido]";

export function sanitizeInput(raw: string): string {
  const normalized = raw.replace(/\0/g, "").replace(/\r/g, "").trim();
  const noControlChars = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");
  const neutralized = BLOCK_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, REDACTION), noControlChars);
  return neutralized.replace(/\s+/g, " ").slice(0, MAX_INPUT_CHARS);
}

export function detectPromptInjection(raw: string): boolean {
  return BLOCK_PATTERNS.some((pattern) => pattern.test(raw));
}

export function enforceInputSize(raw: string): void {
  if (raw.length > MAX_INPUT_CHARS * 2) {
    throw new Error("Input excede limite maximo permitido.");
  }
}
