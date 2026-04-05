import request from "supertest";
import { createServerApp } from "../src/server/app";
import { resetApiMetricsForTests } from "../src/server/metrics";

describe("HTTP API", () => {
  beforeEach(() => {
    resetApiMetricsForTests();
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

  it("deve responder health detalhado", async () => {
    const app = createServerApp();
    const response = await request(app).get("/api/health/details");

    expect([200, 503]).toContain(response.status);
    expect(response.body.service).toBe("repolaunch-api");
    expect(Array.isArray(response.body.checks)).toBe(true);
    expect(response.body.checks.length).toBeGreaterThan(0);
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
    expect(response.body.metadata.generationId).toBeTruthy();
  });

  it("deve listar historico e exportar zip por generationId", async () => {
    const app = createServerApp();

    const generation = await request(app).post("/api/generate").send({
      text: "Quero criar um projeto para portfolio e exportar tudo em zip",
      outputFiles: ["README.md", "ARCHITECTURE.md"]
    });

    expect(generation.status).toBe(200);
    const generationId = generation.body.metadata.generationId as string;

    const history = await request(app).get("/api/history?limit=5");
    expect(history.status).toBe(200);
    expect(Array.isArray(history.body.items)).toBe(true);
    expect(history.body.items.length).toBeGreaterThan(0);
    expect(history.body.items[0].generationId).toBe(generationId);

    const archive = await request(app).get(`/api/history/${generationId}/export.zip`);
    expect(archive.status).toBe(200);
    expect(archive.headers["content-type"]).toContain("application/zip");
    expect(archive.body).toBeTruthy();
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

  it("deve expor metricas com latencia, erros e rotas", async () => {
    const app = createServerApp();

    await request(app).get("/api/prompts");
    await request(app).post("/api/generate").send({
      text: "Quero uma geracao para validar metricas"
    });
    await request(app).post("/api/generate").send({
      text: ""
    });

    const metrics = await request(app).get("/api/metrics?windowMinutes=30");
    expect(metrics.status).toBe(200);
    expect(metrics.body.totalRequests).toBeGreaterThanOrEqual(3);
    expect(metrics.body.totalErrors).toBeGreaterThanOrEqual(1);
    const routeKeys = Object.keys(metrics.body.routes || {});
    const promptsKey = routeKeys.find((key) => key.includes("GET") && key.includes("prompts"));
    const generateKey = routeKeys.find((key) => key.includes("POST") && key.includes("generate"));

    expect(promptsKey).toBeTruthy();
    expect(generateKey).toBeTruthy();
    expect(metrics.body.routes[generateKey as string].avgLatencyMs).toBeGreaterThanOrEqual(0);
    expect(metrics.body.statusBreakdown["2xx"]).toBeGreaterThanOrEqual(1);
    expect(metrics.body.statusBreakdown["4xx"]).toBeGreaterThanOrEqual(1);
    expect(metrics.body.recent.windowMinutes).toBe(30);
    expect(Array.isArray(metrics.body.recent.points)).toBe(true);
    expect(metrics.body.recent.points.length).toBeGreaterThanOrEqual(1);
  });

  it("deve criar projeto colaborativo e vincular geracao", async () => {
    const app = createServerApp();
    const ownerHeaders = { "x-collab-user": "alice" };
    const editorHeaders = { "x-collab-user": "bob" };
    const viewerHeaders = { "x-collab-user": "carol" };

    const createdProject = await request(app)
      .post("/api/collab/projects")
      .set(ownerHeaders)
      .send({
        name: "Workspace Squad Alpha",
        description: "Projeto para compartilhamento interno"
      });
    expect(createdProject.status).toBe(201);
    const projectId = createdProject.body.project.projectId as string;

    const addEditor = await request(app)
      .post(`/api/collab/projects/${projectId}/members`)
      .set(ownerHeaders)
      .send({ userId: "bob", role: "editor" });
    expect(addEditor.status).toBe(201);

    const addViewer = await request(app)
      .post(`/api/collab/projects/${projectId}/members`)
      .set(ownerHeaders)
      .send({ userId: "carol", role: "viewer" });
    expect(addViewer.status).toBe(201);

    const generation = await request(app).post("/api/generate").send({
      text: "Quero gerar documentos para um workspace colaborativo",
      outputFiles: ["README.md"]
    });
    expect(generation.status).toBe(200);
    const generationId = generation.body.metadata.generationId as string;

    const historyForShare = await request(app).get("/api/history?limit=20");
    expect(historyForShare.status).toBe(200);
    const secondGenerationId = (historyForShare.body.items || [])
      .map((item: { generationId?: string }) => item.generationId)
      .find((id: string | undefined) => id && id !== generationId) as string | undefined;
    expect(secondGenerationId).toBeTruthy();

    const attached = await request(app)
      .post(`/api/collab/projects/${projectId}/generations`)
      .set(editorHeaders)
      .send({ generationId });
    expect(attached.status).toBe(200);
    expect(attached.body.attachedGenerationId).toBe(generationId);

    const viewerAttachAttempt = await request(app)
      .post(`/api/collab/projects/${projectId}/generations`)
      .set(viewerHeaders)
      .send({ generationId });
    expect(viewerAttachAttempt.status).toBe(403);
    expect(viewerAttachAttempt.body.error.code).toBe("COLLAB_FORBIDDEN");

    const attachedSecond = await request(app)
      .post(`/api/collab/projects/${projectId}/generations`)
      .set(ownerHeaders)
      .send({ generationId: secondGenerationId as string });
    expect(attachedSecond.status).toBe(200);

    const members = await request(app)
      .get(`/api/collab/projects/${projectId}/members`)
      .set(editorHeaders);
    expect(members.status).toBe(200);
    expect(Array.isArray(members.body.members)).toBe(true);
    expect(members.body.members.find((member: { userId: string; role: string }) => member.userId === "bob")?.role).toBe(
      "editor"
    );

    const audit = await request(app)
      .get(`/api/collab/projects/${projectId}/audit?limit=20`)
      .set(ownerHeaders);
    expect(audit.status).toBe(200);
    expect(Array.isArray(audit.body.events)).toBe(true);
    const eventTypes = audit.body.events.map((event: { type: string }) => event.type);
    expect(eventTypes).toContain("project.created");
    expect(eventTypes).toContain("member.added");
    expect(eventTypes).toContain("generation.attached");

    const outsiderAudit = await request(app)
      .get(`/api/collab/projects/${projectId}/audit`)
      .set({ "x-collab-user": "outsider" });
    expect(outsiderAudit.status).toBe(403);
    expect(outsiderAudit.body.error.code).toBe("COLLAB_FORBIDDEN");

    const projectDetails = await request(app)
      .get(`/api/collab/projects/${projectId}`)
      .set(ownerHeaders);
    expect(projectDetails.status).toBe(200);
    expect(projectDetails.body.project.generationIds).toContain(generationId);
    expect(Array.isArray(projectDetails.body.generations)).toBe(true);

    const projectsList = await request(app)
      .get("/api/collab/projects")
      .set(ownerHeaders);
    expect(projectsList.status).toBe(200);
    expect(Array.isArray(projectsList.body.projects)).toBe(true);
    expect(projectsList.body.projects.find((project: { projectId: string }) => project.projectId === projectId)).toBeTruthy();

    const share = await request(app)
      .post(`/api/collab/projects/${projectId}/share`)
      .set(editorHeaders)
      .send({});
    expect(share.status).toBe(200);
    expect(share.body.shareId).toBeTruthy();
    expect(typeof share.body.shareUrl).toBe("string");

    const sharedReadOnly = await request(app).get(`/api/share/${share.body.shareId}`);
    expect(sharedReadOnly.status).toBe(200);
    expect(sharedReadOnly.body.project.projectId).toBe(projectId);
    expect(Array.isArray(sharedReadOnly.body.generations)).toBe(true);
    expect(sharedReadOnly.body.generations.length).toBeGreaterThanOrEqual(2);
    expect(sharedReadOnly.body.generations[0].generationId).toBe(secondGenerationId);
  });
});
