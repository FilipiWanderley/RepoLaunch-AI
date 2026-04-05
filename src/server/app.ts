import express from "express";
import cors from "cors";
import JSZip from "jszip";
import { z } from "zod";
import { RepoLaunchController } from "../controllers/repolaunch-controller";
import { normalizeMode, normalizeTemplateType } from "../types/output";
import { CliError, normalizeCliError } from "../errors/cli-error";
import { listPromptVersions } from "../prompts/system-prompts";
import { readEnv } from "../config/env";
import { createApiSecurity } from "./security";
import { getApiMetrics, recordApiError, recordApiRequest } from "./metrics";

const GenerateRequestSchema = z.object({
  text: z.string().min(1, "Texto de entrada e obrigatorio."),
  mode: z.string().optional(),
  template: z.string().optional(),
  promptVersion: z.string().optional(),
  outputFiles: z.array(z.string().min(1)).optional()
});

const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional()
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
  app.use("/api", (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      recordApiRequest({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        latencyMs: durationMs
      });
    });
    next();
  });
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

  app.get("/api/metrics", (_req, res) => {
    res.json(getApiMetrics());
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

  app.get("/api/history", async (req, res, next) => {
    try {
      const query = HistoryQuerySchema.parse(req.query);
      const items = await controller.listWebGenerations(query.limit ?? 10);
      res.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/history/:generationId/export.zip", async (req, res, next) => {
    try {
      const generationId = String(req.params.generationId ?? "").trim();
      if (!generationId) {
        throw new CliError("generationId e obrigatorio.", {
          code: "INVALID_GENERATION_ID",
          hint: "Informe um generationId valido na rota.",
          exitCode: 400
        });
      }

      const item = await controller.getWebGeneration(generationId);
      if (!item) {
        throw new CliError("Geracao nao encontrada.", {
          code: "GENERATION_NOT_FOUND",
          hint: "Revise o generationId e tente novamente.",
          exitCode: 404
        });
      }

      const zip = new JSZip();
      for (const [fileName, content] of Object.entries(item.files)) {
        zip.file(fileName, content);
      }

      const archive = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="repolaunch-${generationId}.zip"`);
      res.send(archive);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const normalized = normalizeCliError(error);
    recordApiError(normalized.code);
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
