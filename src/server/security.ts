import { Request, Response, NextFunction } from "express";
import { CliError } from "../errors/cli-error";

type ApiSecurityConfig = {
  authToken?: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

export function createApiSecurity(config: ApiSecurityConfig): {
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
  rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
} {
  const buckets = new Map<string, RateBucket>();

  const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.path === "/health") {
      next();
      return;
    }

    if (!config.authToken) {
      next();
      return;
    }

    const token = req.header("x-api-token");
    if (token === config.authToken) {
      next();
      return;
    }

    next(
      new CliError("Token de API invalido ou ausente.", {
        code: "API_UNAUTHORIZED",
        hint: "Envie o header x-api-token com um token valido.",
        exitCode: 401
      })
    );
  };

  const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === "/health") {
      next();
      return;
    }

    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const previous = buckets.get(key);
    if (!previous || now >= previous.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + config.rateLimitWindowMs
      });
      next();
      return;
    }

    previous.count += 1;
    const remaining = Math.max(0, config.rateLimitMax - previous.count);
    res.setHeader("x-ratelimit-remaining", String(remaining));
    res.setHeader("x-ratelimit-reset", String(previous.resetAt));

    if (previous.count > config.rateLimitMax) {
      next(
        new CliError("Limite de requisicoes excedido para a API.", {
          code: "API_RATE_LIMIT_EXCEEDED",
          hint: "Aguarde a janela de rate limit ou reduza a frequencia de chamadas.",
          exitCode: 429
        })
      );
      return;
    }

    next();
  };

  return {
    authMiddleware,
    rateLimitMiddleware
  };
}
