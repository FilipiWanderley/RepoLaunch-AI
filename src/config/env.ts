import { z } from "zod";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini")
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(): AppEnv {
  return EnvSchema.parse(process.env);
}
