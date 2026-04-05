import express from "express";
import cors from "cors";
import { z } from "zod";
import { RepoLaunchController } from "../controllers/repolaunch-controller";
import { normalizeMode, normalizeTemplateType } from "../types/output";
import { CliError, normalizeCliError } from "../errors/cli-error";
import { listPromptVersions } from "../prompts/system-prompts";
import { readEnv } from "../config/env";
import { createApiSecurity } from "./security";

const GenerateRequestSchema = z.object({
  text: z.string().min(1, "Texto de entrada e obrigatorio."),
  mode: z.string().optional(),
  template: z.string().optional(),
  promptVersion: z.string().optional(),
  outputFiles: z.array(z.string().min(1)).optional()
});

export function createServerApp(): express.Express {
  const app = express();
  const controller = new RepoLaunchController();
  const env = readEnv();
  const security = createApiSecurity({
    authToken: env.API_AUTH_TOKEN,
    rateLimitWindowMs: env.API_RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.API_RATE_LIMIT_MAX
  });

  app.use(cors({ allowedHeaders: ["Content-Type", "x-api-token"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", security.rateLimitMiddleware);
  app.use("/api", security.authMiddleware);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "repolaunch-api" });
  });

  app.get("/api/prompts", (_req, res) => {
    const registry = listPromptVersions();
    res.json({
      versions: registry.versions,
      source: registry.source,
      filePath: registry.filePath
    });
  });

  app.post("/api/generate", async (req, res, next) => {
    try {
      const parsed = GenerateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new CliError("Payload invalido para /api/generate.", {
          code: "INVALID_WEB_GENERATE_INPUT",
          hint: "Envie ao menos text, com mode/template opcionais.",
          exitCode: 400
        });
      }

      const payload = parsed.data;
      const result = await controller.generateForWeb({
        text: payload.text,
        mode: normalizeMode(payload.mode),
        template: normalizeTemplateType(payload.template),
        promptVersion: payload.promptVersion,
        outputFiles: payload.outputFiles
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const normalized = normalizeCliError(error);
    const status = normalized.exitCode >= 400 && normalized.exitCode < 600 ? normalized.exitCode : 500;

    res.status(status).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        hint: normalized.hint
      }
    });
  });

  return app;
}
