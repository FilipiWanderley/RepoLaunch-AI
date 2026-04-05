import fs from "node:fs/promises";
import path from "node:path";

export class OutputService {
  private get outputDir(): string {
    if (process.env.VERCEL) {
      return "/tmp/outputs";
    }
    return path.resolve(process.cwd(), "outputs");
  }

  private get configDir(): string {
    return path.resolve(process.cwd(), "config");
  }

  async ensureBaseStructure(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.configDir, { recursive: true });

    const configPath = path.join(this.configDir, "repolaunch.config.json");
    const exists = await this.exists(configPath);
    if (!exists) {
      await fs.writeFile(
        configPath,
        JSON.stringify({ projectName: "RepoLaunch AI", outputDir: "outputs" }, null, 2),
        "utf8"
      );
    }
  }

  async writeText(fileName: string, content: string): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(path.join(this.outputDir, fileName), content, "utf8");
  }

  async writeJson(fileName: string, payload: unknown): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(path.join(this.outputDir, fileName), JSON.stringify(payload, null, 2), "utf8");
  }

  async readJson<T>(fileName: string): Promise<T> {
    const content = await fs.readFile(path.join(this.outputDir, fileName), "utf8");
    return JSON.parse(content) as T;
  }

  async buildManifest(): Promise<{ generatedAt: string; files: string[] }> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const entries = await fs.readdir(this.outputDir, { withFileTypes: true });
    return {
      generatedAt: new Date().toISOString(),
      files: entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()
    };
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
