import request from "supertest";
import { createServerApp } from "../src/server/app";

describe("HTTP API", () => {
  beforeEach(() => {
    delete process.env.API_AUTH_TOKEN;
    delete process.env.API_RATE_LIMIT_WINDOW_MS;
    delete process.env.API_RATE_LIMIT_MAX;
  });

  it("deve responder healthcheck", async () => {
    const app = createServerApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("deve listar versoes de prompt", async () => {
    const app = createServerApp();
    const response = await request(app).get("/api/prompts");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.versions)).toBe(true);
    expect(response.body.versions.length).toBeGreaterThan(0);
  });

  it("deve gerar arquivos via /api/generate", async () => {
    const app = createServerApp();
    const response = await request(app).post("/api/generate").send({
      text: "Quero transformar meus estudos em um projeto com documentacao forte",
      mode: "technical",
      template: "portfolio-project",
      promptVersion: "v1",
      outputFiles: ["README.md", "ARCHITECTURE.md"]
    });

    expect(response.status).toBe(200);
    expect(response.body.files["README.md"]).toBeTruthy();
    expect(response.body.files["ARCHITECTURE.md"]).toBeTruthy();
    expect(response.body.metadata.promptVersion).toBe("v1");
  });

  it("deve rejeitar payload invalido", async () => {
    const app = createServerApp();
    const response = await request(app).post("/api/generate").send({
      text: ""
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_WEB_GENERATE_INPUT");
  });

  it("deve exigir token quando API_AUTH_TOKEN estiver configurado", async () => {
    process.env.API_AUTH_TOKEN = "segredo-local";
    const app = createServerApp();

    const unauthorized = await request(app).get("/api/prompts");
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe("API_UNAUTHORIZED");

    const authorized = await request(app)
      .get("/api/prompts")
      .set("x-api-token", "segredo-local");
    expect(authorized.status).toBe(200);
  });

  it("deve bloquear excesso de chamadas com rate limit", async () => {
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.API_RATE_LIMIT_MAX = "2";
    const app = createServerApp();

    const first = await request(app).get("/api/prompts");
    const second = await request(app).get("/api/prompts");
    const third = await request(app).get("/api/prompts");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("API_RATE_LIMIT_EXCEEDED");
  });
});
