import fs from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";
import { readEnv } from "../config/env";
import { listPromptVersions } from "../prompts/system-prompts";

type HealthCheck = {
  name: string;
  ok: boolean;
  details: string;
};

export type DetailedHealthReport = {
  status: "ok" | "degraded";
  service: "repolaunch-api";
  timestamp: string;
  uptimeSeconds: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
  };
  checks: HealthCheck[];
};

async function checkWritableDir(dirPath: string, name: string): Promise<HealthCheck> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    await fs.access(dirPath, fsConstants.R_OK | fsConstants.W_OK);
    return {
      name,
      ok: true,
      details: `${dirPath} acessivel para leitura/escrita`
    };
  } catch (error) {
    return {
      name,
      ok: false,
      details: error instanceof Error ? error.message : "erro desconhecido"
    };
  }
}

export async function buildDetailedHealthReport(): Promise<DetailedHealthReport> {
  const env = readEnv();
  const promptRegistry = listPromptVersions();

  const outputDir = path.resolve(process.cwd(), "outputs");
  const configDir = path.resolve(process.cwd(), "config");

  const checks: HealthCheck[] = [
    {
      name: "env",
      ok: true,
      details: `configuracao carregada (log=${env.LOG_LEVEL})`
    },
    {
      name: "prompt-registry",
      ok: true,
      details: `origem=${promptRegistry.source}; versoes=${promptRegistry.versions.join(",")}`
    },
    {
      name: "ai-provider",
      ok: Boolean(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY),
      details: env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY ? "provider real configurado" : "somente modo mock"
    },
    await checkWritableDir(outputDir, "storage-outputs"),
    await checkWritableDir(configDir, "storage-config")
  ];

  const memory = process.memoryUsage();
  const status = checks.some((check) => !check.ok) ? "degraded" : "ok";

  return {
    status,
    service: "repolaunch-api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    memory: {
      rssMb: Number((memory.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(2))
    },
    checks
  };
}
