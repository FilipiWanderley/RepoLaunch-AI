export type OutputMode = "technical" | "recruiter" | "simplified";

export type ExportFormat = "json" | "markdown" | "issues";

export type TemplateType = "portfolio-project" | "saas" | "cli-tool" | "ai-workflow";

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

export function normalizeTemplateType(template?: string): TemplateType {
  if (
    template === "portfolio-project" ||
    template === "saas" ||
    template === "cli-tool" ||
    template === "ai-workflow"
  ) {
    return template;
  }

  return "portfolio-project";
}
