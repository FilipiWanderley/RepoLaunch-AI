import { createHmac, timingSafeEqual } from "node:crypto";
import { CliError } from "../errors/cli-error";

type UserRecord = {
  userId: string;
  password: string;
  name?: string;
};

type SessionPayload = {
  userId: string;
  name?: string;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function parseUsers(rawUsers: string | undefined): UserRecord[] {
  const value = String(rawUsers ?? "").trim();
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [userIdRaw, passwordRaw, nameRaw] = entry.split(":");
      const userId = String(userIdRaw ?? "")
        .trim()
        .toLowerCase();
      const password = String(passwordRaw ?? "").trim();
      const name = String(nameRaw ?? "").trim() || undefined;

      if (!userId || !password) {
        return null;
      }

      return {
        userId,
        password,
        name
      } as UserRecord;
    })
    .filter((item): item is UserRecord => Boolean(item));
}

export function createCollabAuth(config: {
  usersRaw?: string;
  ttlMinutes: number;
}): {
  isEnabled: boolean;
  login: (userId: string, password: string) => { token: string; userId: string; name?: string; expiresAt: string };
  verify: (token: string) => { userId: string; name?: string };
} {
  const users = parseUsers(config.usersRaw);
  const isEnabled = users.length > 0;

  const secretBase = users.map((user) => `${user.userId}:${user.password}`).join("|");
  const secret = sign(`collab:${secretBase}`, "repolaunch-collab-auth");

  const login = (userId: string, password: string): { token: string; userId: string; name?: string; expiresAt: string } => {
    if (!isEnabled) {
      throw new CliError("Autenticacao colaborativa nao esta habilitada.", {
        code: "COLLAB_AUTH_DISABLED",
        hint: "Defina COLLAB_AUTH_USERS para habilitar login colaborativo.",
        exitCode: 400
      });
    }

    const normalizedUserId = String(userId ?? "")
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password ?? "").trim();
    const user = users.find((entry) => entry.userId === normalizedUserId && entry.password === normalizedPassword);

    if (!user) {
      throw new CliError("Credenciais colaborativas invalidas.", {
        code: "COLLAB_AUTH_INVALID_CREDENTIALS",
        hint: "Revise usuario/senha e tente novamente.",
        exitCode: 401
      });
    }

    const expiresAtMs = Date.now() + config.ttlMinutes * 60_000;
    const payload: SessionPayload = {
      userId: user.userId,
      name: user.name,
      exp: expiresAtMs
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(encodedPayload, secret);
    return {
      token: `${encodedPayload}.${signature}`,
      userId: user.userId,
      name: user.name,
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  };

  const verify = (token: string): { userId: string; name?: string } => {
    if (!isEnabled) {
      throw new CliError("Autenticacao colaborativa nao esta habilitada.", {
        code: "COLLAB_AUTH_DISABLED",
        hint: "Defina COLLAB_AUTH_USERS para habilitar validacao de token.",
        exitCode: 400
      });
    }

    const value = String(token ?? "").trim();
    const parts = value.split(".");
    if (parts.length !== 2) {
      throw new CliError("Token colaborativo invalido.", {
        code: "COLLAB_AUTH_INVALID_TOKEN",
        hint: "Refaca o login para obter um novo token.",
        exitCode: 401
      });
    }

    const [encodedPayload, incomingSignature] = parts;
    const expectedSignature = sign(encodedPayload, secret);
    const sameLength = Buffer.byteLength(incomingSignature) === Buffer.byteLength(expectedSignature);
    const validSignature =
      sameLength &&
      timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(expectedSignature));

    if (!validSignature) {
      throw new CliError("Token colaborativo invalido.", {
        code: "COLLAB_AUTH_INVALID_TOKEN",
        hint: "Refaca o login para obter um novo token.",
        exitCode: 401
      });
    }

    let payload: SessionPayload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    } catch {
      throw new CliError("Token colaborativo invalido.", {
        code: "COLLAB_AUTH_INVALID_TOKEN",
        hint: "Refaca o login para obter um novo token.",
        exitCode: 401
      });
    }

    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      throw new CliError("Sessao colaborativa expirada.", {
        code: "COLLAB_AUTH_EXPIRED",
        hint: "Refaca o login para continuar.",
        exitCode: 401
      });
    }

    return {
      userId: payload.userId,
      name: payload.name
    };
  };

  return {
    isEnabled,
    login,
    verify
  };
}
