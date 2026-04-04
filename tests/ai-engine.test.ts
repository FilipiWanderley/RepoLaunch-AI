import { AIEngine } from "../src/ai/ai-engine";

describe("AIEngine", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    jest.restoreAllMocks();
  });

  it("deve usar provider mock quando nao houver chaves", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const engine = new AIEngine();
    const result = await engine.generate({
      systemPrompt: "system",
      userInput: "user"
    });

    expect(result.provider).toBe("mock");
    expect(result.content).toContain("Mock response");
  });

  it("deve aplicar retry no Anthropic e concluir com sucesso", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.AI_MAX_RETRIES = "1";
    process.env.AI_TIMEOUT_MS = "5000";

    let calls = 0;
    const fetchMock = jest.spyOn(global, "fetch" as never).mockImplementation(async () => {
      calls += 1;

      if (calls === 1) {
        return {
          ok: false,
          status: 500,
          json: async () => ({})
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ text: "Resposta de teste" }]
        })
      } as Response;
    });

    const engine = new AIEngine();
    const result = await engine.generate({
      systemPrompt: "system",
      userInput: "user"
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.provider).toBe("anthropic");
    expect(result.content).toContain("Resposta de teste");
  });
});
