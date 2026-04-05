import request from "supertest";
import { createServerApp } from "../src/server/app";

describe("HTTP API", () => {
  const app = createServerApp();

  it("deve responder healthcheck", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("deve listar versoes de prompt", async () => {
    const response = await request(app).get("/api/prompts");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.versions)).toBe(true);
    expect(response.body.versions.length).toBeGreaterThan(0);
  });

  it("deve gerar arquivos via /api/generate", async () => {
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
    const response = await request(app).post("/api/generate").send({
      text: ""
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_WEB_GENERATE_INPUT");
  });
});
