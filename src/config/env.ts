import { z } from "zod";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  DEFAULT_PROMPT_VERSION: z.string().default("v1"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  LOG_LEVEL: z.enum(["debug", "info", "warning", "error"]).default("info"),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPO: z.string().optional()
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(): AppEnv {
  return EnvSchema.parse(process.env);
}
