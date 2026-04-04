import { InputAnalyzerService } from "../src/services/input-analyzer-service";

describe("InputAnalyzerService", () => {
  it("deve extrair intencao e tema de texto com IA", async () => {
    const service = new InputAnalyzerService();

    const result = await service.analyze({ text: "Fiz um curso de IA e quero montar portfolio." });

    expect(result.theme).toBe("IA aplicada");
    expect(result.intent).toContain("portfolio");
  });
});
