export type AIRequest = {
  systemPrompt: string;
  userInput: string;
};

export type AIResponse = {
  content: string;
  provider: "mock";
};

// Camada preparada para futura integracao com Claude e fallback OpenAI.
export class AIEngine {
  async generate(request: AIRequest): Promise<AIResponse> {
    const preview = `${request.systemPrompt}\n\n${request.userInput}`.slice(0, 300);
    return {
      content: `Mock response baseada no contexto: ${preview}`,
      provider: "mock"
    };
  }
}
