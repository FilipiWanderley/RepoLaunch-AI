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
import { buildDetailedHealthReport } from "./health";
import { CollaborationRole, CollaborationStore } from "./collaboration-store";
import { createCollabAuth } from "./collab-auth";

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

const MetricsQuerySchema = z.object({
  windowMinutes: z.coerce.number().int().positive().max(120).optional()
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional()
});

const AttachGenerationSchema = z.object({
  generationId: z.string().min(1)
});

const AuditQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional()
});

const ManageMemberSchema = z.object({
  userId: z.string().min(1).max(80),
  name: z.string().max(80).optional(),
  role: z.enum(["owner", "editor", "viewer"])
});

const CollabLoginSchema = z.object({
  userId: z.string().min(1).max(80),
  password: z.string().min(1).max(120)
});

function normalizeCollabUserId(value: string | undefined): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return "local-user";
  }
  const safe = normalized.replace(/[^a-z0-9_.-]/g, "");
  return safe || "local-user";
}

function getCollabUser(req: express.Request): { userId: string; name?: string } {
  return {
    userId: normalizeCollabUserId(req.get("x-collab-user")),
    name: String(req.get("x-collab-user-name") ?? "").trim() || undefined
  };
}

function requireProjectRole(project: { members: Array<{ userId: string; role: CollaborationRole }> }, userId: string, allowed: CollaborationRole[]): void {
  const member = project.members.find((entry) => entry.userId === userId);
  if (!member || !allowed.includes(member.role)) {
    throw new CliError("Usuario sem permissao para esta operacao.", {
      code: "COLLAB_FORBIDDEN",
      hint: `Permissao requerida: ${allowed.join(", ")}.`,
      exitCode: 403
    });
  }
}

export function createServerApp(): express.Express {
  const app = express();
  const controller = new RepoLaunchController();
  const collaborationStore = new CollaborationStore();
  const env = readEnv();
  const collabAuth = createCollabAuth({
    usersRaw: env.COLLAB_AUTH_USERS,
    ttlMinutes: env.COLLAB_AUTH_SESSION_TTL_MINUTES
  });
  const security = createApiSecurity({
    authToken: env.API_AUTH_TOKEN,
    rateLimitWindowMs: env.API_RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.API_RATE_LIMIT_MAX
  });

  function resolveCollabUser(req: express.Request): { userId: string; name?: string } {
    if (!collabAuth.isEnabled) {
      return getCollabUser(req);
    }

    const token = String(req.get("x-collab-token") ?? "").trim();
    if (!token) {
      throw new CliError("Sessao colaborativa ausente.", {
        code: "COLLAB_AUTH_REQUIRED",
        hint: "Realize login em /api/collab/auth/login e envie x-collab-token.",
        exitCode: 401
      });
    }

    const resolved = collabAuth.verify(token);
    return {
      userId: normalizeCollabUserId(resolved.userId),
      name: resolved.name
    };
  }

  app.use(cors({ allowedHeaders: ["Content-Type", "x-api-token", "x-collab-user", "x-collab-user-name", "x-collab-token"] }));
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

  app.get("/api/health/details", async (_req, res, next) => {
    try {
      const report = await buildDetailedHealthReport();
      res.status(report.status === "ok" ? 200 : 503).json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/prompts", (_req, res) => {
    const registry = listPromptVersions();
    res.json({
      versions: registry.versions,
      source: registry.source,
      filePath: registry.filePath
    });
  });

  app.get("/api/metrics", (req, res, next) => {
    try {
      const query = MetricsQuerySchema.parse(req.query);
      res.json(getApiMetrics(query.windowMinutes ?? 15));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/collab/auth/login", (req, res, next) => {
    try {
      const payload = CollabLoginSchema.parse(req.body);
      const session = collabAuth.login(payload.userId, payload.password);
      res.json({
        authEnabled: collabAuth.isEnabled,
        session
      });
    } catch (error) {
      next(error);
    }
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

  app.get("/api/collab/projects", async (_req, res, next) => {
    try {
      const user = resolveCollabUser(_req);
      const projects = await collaborationStore.listProjects();
      res.json({
        projects: projects.map((project) => ({
          projectId: project.projectId,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          generationCount: project.generationIds.length,
          memberCount: project.members.length,
          currentUserRole: project.members.find((member) => member.userId === user.userId)?.role,
          shareId: project.shareId
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/collab/projects", async (req, res, next) => {
    try {
      const payload = CreateProjectSchema.parse(req.body);
      const user = resolveCollabUser(req);
      const project = await collaborationStore.createProject(payload.name.trim(), payload.description?.trim(), user);
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/collab/projects/:projectId", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const user = resolveCollabUser(req);
      const project = await collaborationStore.getProject(projectId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      requireProjectRole(project, user.userId, ["owner", "editor", "viewer"]);

      const generations = await Promise.all(
        project.generationIds.map(async (generationId) => controller.getWebGeneration(generationId))
      );

      res.json({
        project,
        generations: generations.filter((item) => Boolean(item))
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/collab/projects/:projectId/generations", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const user = resolveCollabUser(req);
      const payload = AttachGenerationSchema.parse(req.body);

      const existingProject = await collaborationStore.getProject(projectId);
      if (!existingProject) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }
      requireProjectRole(existingProject, user.userId, ["owner", "editor"]);

      const generation = await controller.getWebGeneration(payload.generationId);
      if (!generation) {
        throw new CliError("Geracao nao encontrada para vinculacao.", {
          code: "GENERATION_NOT_FOUND",
          hint: "Gere um projeto antes de vincular ao workspace colaborativo.",
          exitCode: 404
        });
      }

      const project = await collaborationStore.attachGeneration(projectId, payload.generationId, user.userId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      res.json({
        project,
        attachedGenerationId: payload.generationId
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/collab/projects/:projectId/share", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const user = resolveCollabUser(req);
      const existingProject = await collaborationStore.getProject(projectId);
      if (!existingProject) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }
      requireProjectRole(existingProject, user.userId, ["owner", "editor"]);

      const shared = await collaborationStore.createOrGetShareId(projectId, user.userId);
      if (!shared) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      const shareUrl = `${req.protocol}://${req.get("host")}/api/share/${shared.shareId}`;
      res.json({
        projectId,
        shareId: shared.shareId,
        shareUrl
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/collab/projects/:projectId/members", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const user = resolveCollabUser(req);
      const project = await collaborationStore.getProject(projectId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      requireProjectRole(project, user.userId, ["owner", "editor", "viewer"]);
      const members = await collaborationStore.listMembers(projectId);
      res.json({ projectId, members: members ?? [] });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/collab/projects/:projectId/members", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const payload = ManageMemberSchema.parse(req.body);
      const user = resolveCollabUser(req);
      const project = await collaborationStore.getProject(projectId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      requireProjectRole(project, user.userId, ["owner"]);
      const updated = await collaborationStore.upsertMember(projectId, {
        userId: normalizeCollabUserId(payload.userId),
        name: payload.name?.trim() || undefined,
        role: payload.role
      }, user.userId);
      if (!updated) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }
      res.status(201).json({ project: updated });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/collab/projects/:projectId/members/:userId", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const targetUserId = normalizeCollabUserId(String(req.params.userId ?? "").trim());
      const payload = ManageMemberSchema.omit({ userId: true }).parse(req.body);
      const user = resolveCollabUser(req);
      const project = await collaborationStore.getProject(projectId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      requireProjectRole(project, user.userId, ["owner"]);
      const updated = await collaborationStore.updateMemberRole(
        projectId,
        targetUserId,
        payload.role,
        payload.name?.trim() || undefined,
        user.userId
      );

      if (!updated) {
        throw new CliError("Membro de colaboracao nao encontrado.", {
          code: "COLLAB_MEMBER_NOT_FOUND",
          hint: "Revise o userId e tente novamente.",
          exitCode: 404
        });
      }

      res.json({ project: updated });
    } catch (error) {
      if (error instanceof Error && error.message === "LAST_OWNER_DEMOTION_NOT_ALLOWED") {
        next(
          new CliError("Nao e permitido remover o ultimo owner do workspace.", {
            code: "COLLAB_LAST_OWNER_FORBIDDEN",
            hint: "Promova outro membro para owner antes de alterar este papel.",
            exitCode: 409
          })
        );
        return;
      }
      next(error);
    }
  });

  app.get("/api/collab/projects/:projectId/audit", async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId ?? "").trim();
      const user = resolveCollabUser(req);
      const query = AuditQuerySchema.parse(req.query);
      const project = await collaborationStore.getProject(projectId);
      if (!project) {
        throw new CliError("Projeto de colaboracao nao encontrado.", {
          code: "COLLAB_PROJECT_NOT_FOUND",
          hint: "Revise o projectId e tente novamente.",
          exitCode: 404
        });
      }

      requireProjectRole(project, user.userId, ["owner", "editor", "viewer"]);
      const events = await collaborationStore.listAuditEvents(projectId, query.limit ?? 30);
      res.json({ projectId, events: events ?? [] });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/share/:shareId", async (req, res, next) => {
    try {
      const shareId = String(req.params.shareId ?? "").trim();
      if (!shareId) {
        throw new CliError("shareId e obrigatorio.", {
          code: "INVALID_SHARE_ID",
          hint: "Informe um shareId valido.",
          exitCode: 400
        });
      }

      const project = await collaborationStore.getProjectByShareId(shareId);
      if (!project) {
        throw new CliError("Projeto compartilhado nao encontrado.", {
          code: "SHARED_PROJECT_NOT_FOUND",
          hint: "Revise o link de compartilhamento.",
          exitCode: 404
        });
      }

      const generations = await Promise.all(
        project.generationIds.map(async (generationId) => controller.getWebGeneration(generationId))
      );

      res.json({
        project: {
          projectId: project.projectId,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          sharedAt: project.sharedAt,
          generationCount: project.generationIds.length
        },
        generations: generations.filter((item) => Boolean(item))
      });
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
