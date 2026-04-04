export type OutputMode = "technical" | "recruiter" | "simplified";

export type ExportFormat = "json" | "markdown" | "issues";

export function normalizeMode(mode?: string): OutputMode {
  if (mode === "recruiter" || mode === "simplified" || mode === "technical") {
    return mode;
  }
  return "technical";
}

export function normalizeExportFormat(format?: string): ExportFormat {
  if (format === "markdown" || format === "issues" || format === "json") {
    return format;
  }
  return "json";
}
