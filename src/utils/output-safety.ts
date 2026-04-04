const DISALLOWED_PATTERNS = [
  /rm\s+-rf\s+\//gi,
  /curl\s+.*\|\s*sh/gi,
  /wget\s+.*\|\s*sh/gi
];

export function validateOutputSafety(content: string): string {
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error("Output bloqueado por politica de seguranca.");
    }
  }

  return content;
}
