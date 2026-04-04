import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "outputs");
const CONFIG_DIR = path.resolve(process.cwd(), "config");

export class OutputService {
  async ensureBaseStructure(): Promise<void> {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    const configPath = path.join(CONFIG_DIR, "repolaunch.config.json");
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
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUTPUT_DIR, fileName), content, "utf8");
  }

  async writeJson(fileName: string, payload: unknown): Promise<void> {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUTPUT_DIR, fileName), JSON.stringify(payload, null, 2), "utf8");
  }

  async readJson<T>(fileName: string): Promise<T> {
    const content = await fs.readFile(path.join(OUTPUT_DIR, fileName), "utf8");
    return JSON.parse(content) as T;
  }

  async buildManifest(): Promise<{ generatedAt: string; files: string[] }> {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
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
