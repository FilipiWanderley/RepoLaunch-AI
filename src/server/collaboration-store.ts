import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORE_FILE = "collaboration-projects.json";

export type CollaborationProject = {
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  generationIds: string[];
};

type CollaborationStoreData = {
  projects: CollaborationProject[];
};

function nowIso(): string {
  return new Date().toISOString();
}

export class CollaborationStore {
  private get outputDir(): string {
    return path.resolve(process.cwd(), "outputs");
  }

  private get filePath(): string {
    return path.join(this.outputDir, STORE_FILE);
  }

  async listProjects(): Promise<CollaborationProject[]> {
    const data = await this.read();
    return data.projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createProject(name: string, description?: string): Promise<CollaborationProject> {
    const data = await this.read();
    const project: CollaborationProject = {
      projectId: randomUUID(),
      name,
      description,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      generationIds: []
    };

    data.projects.unshift(project);
    await this.write(data);
    return project;
  }

  async getProject(projectId: string): Promise<CollaborationProject | null> {
    const data = await this.read();
    return data.projects.find((project) => project.projectId === projectId) ?? null;
  }

  async attachGeneration(projectId: string, generationId: string): Promise<CollaborationProject | null> {
    const data = await this.read();
    const project = data.projects.find((entry) => entry.projectId === projectId);
    if (!project) {
      return null;
    }

    if (!project.generationIds.includes(generationId)) {
      project.generationIds.unshift(generationId);
    }
    project.updatedAt = nowIso();

    await this.write(data);
    return project;
  }

  private async read(): Promise<CollaborationStoreData> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as CollaborationStoreData;
      if (!Array.isArray(parsed.projects)) {
        return { projects: [] };
      }
      return parsed;
    } catch {
      return { projects: [] };
    }
  }

  private async write(data: CollaborationStoreData): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }
}
