export class ExecutionGuardService {
  private readonly minIntervalMs = 1500;
  private lastExecutionAt = 0;

  assertCanExecute(): void {
    const now = Date.now();
    if (now - this.lastExecutionAt < this.minIntervalMs) {
      throw new Error("Execucao muito frequente. Aguarde alguns segundos e tente novamente.");
    }
    this.lastExecutionAt = now;
  }
}
