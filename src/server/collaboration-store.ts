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
  members: CollaborationMember[];
  auditEvents: CollaborationAuditEvent[];
  shareId?: string;
  sharedAt?: string;
};

export type CollaborationRole = "owner" | "editor" | "viewer";

export type CollaborationMember = {
  userId: string;
  name?: string;
  role: CollaborationRole;
  addedAt: string;
};

export type CollaborationAuditEventType =
  | "project.created"
  | "member.added"
  | "member.role_updated"
  | "generation.attached"
  | "share.created";

export type CollaborationAuditEvent = {
  eventId: string;
  type: CollaborationAuditEventType;
  actorUserId: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
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

  async createProject(
    name: string,
    description?: string,
    owner?: { userId: string; name?: string }
  ): Promise<CollaborationProject> {
    const data = await this.read();
    const createdAt = nowIso();
    const project: CollaborationProject = {
      projectId: randomUUID(),
      name,
      description,
      createdAt,
      updatedAt: createdAt,
      generationIds: [],
      auditEvents: [],
      members: [
        {
          userId: owner?.userId ?? "local-user",
          name: owner?.name,
          role: "owner",
          addedAt: createdAt
        }
      ]
    };

    this.appendAuditEvent(project, {
      type: "project.created",
      actorUserId: owner?.userId ?? "local-user",
      metadata: {
        name,
        hasDescription: Boolean(description)
      }
    });

    data.projects.unshift(project);
    await this.write(data);
    return project;
  }

  async getProject(projectId: string): Promise<CollaborationProject | null> {
    const data = await this.read();
    return data.projects.find((project) => project.projectId === projectId) ?? null;
  }

  async listMembers(projectId: string): Promise<CollaborationMember[] | null> {
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }
    return [...project.members].sort((a, b) => a.userId.localeCompare(b.userId));
  }

  async upsertMember(
    projectId: string,
    member: { userId: string; name?: string; role: CollaborationRole },
    actorUserId = "local-user"
  ): Promise<CollaborationProject | null> {
    const data = await this.read();
    const project = data.projects.find((entry) => entry.projectId === projectId);
    if (!project) {
      return null;
    }

    const existing = project.members.find((entry) => entry.userId === member.userId);
    if (existing) {
      const previousRole = existing.role;
      existing.role = member.role;
      existing.name = member.name;
      this.appendAuditEvent(project, {
        type: "member.role_updated",
        actorUserId,
        metadata: {
          userId: member.userId,
          fromRole: previousRole,
          toRole: member.role
        }
      });
    } else {
      project.members.push({
        userId: member.userId,
        name: member.name,
        role: member.role,
        addedAt: nowIso()
      });
      this.appendAuditEvent(project, {
        type: "member.added",
        actorUserId,
        metadata: {
          userId: member.userId,
          role: member.role
        }
      });
    }

    project.updatedAt = nowIso();
    await this.write(data);
    return project;
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: CollaborationRole,
    name?: string,
    actorUserId = "local-user"
  ): Promise<CollaborationProject | null> {
    const data = await this.read();
    const project = data.projects.find((entry) => entry.projectId === projectId);
    if (!project) {
      return null;
    }

    const target = project.members.find((entry) => entry.userId === userId);
    if (!target) {
      return null;
    }

    if (target.role === "owner" && role !== "owner") {
      const owners = project.members.filter((entry) => entry.role === "owner");
      if (owners.length <= 1) {
        throw new Error("LAST_OWNER_DEMOTION_NOT_ALLOWED");
      }
    }

    const previousRole = target.role;
    target.role = role;
    if (name !== undefined) {
      target.name = name;
    }
    this.appendAuditEvent(project, {
      type: "member.role_updated",
      actorUserId,
      metadata: {
        userId,
        fromRole: previousRole,
        toRole: role
      }
    });
    project.updatedAt = nowIso();
    await this.write(data);
    return project;
  }

  async attachGeneration(
    projectId: string,
    generationId: string,
    actorUserId = "local-user"
  ): Promise<CollaborationProject | null> {
    const data = await this.read();
    const project = data.projects.find((entry) => entry.projectId === projectId);
    if (!project) {
      return null;
    }

    if (!project.generationIds.includes(generationId)) {
      project.generationIds.unshift(generationId);
      this.appendAuditEvent(project, {
        type: "generation.attached",
        actorUserId,
        metadata: {
          generationId
        }
      });
    }
    project.updatedAt = nowIso();

    await this.write(data);
    return project;
  }

  async createOrGetShareId(
    projectId: string,
    actorUserId = "local-user"
  ): Promise<{ project: CollaborationProject; shareId: string } | null> {
    const data = await this.read();
    const project = data.projects.find((entry) => entry.projectId === projectId);
    if (!project) {
      return null;
    }

    if (!project.shareId) {
      project.shareId = randomUUID();
      project.sharedAt = nowIso();
      this.appendAuditEvent(project, {
        type: "share.created",
        actorUserId,
        metadata: {
          shareId: project.shareId
        }
      });
      project.updatedAt = nowIso();
      await this.write(data);
    }

    return {
      project,
      shareId: project.shareId
    };
  }

  async getProjectByShareId(shareId: string): Promise<CollaborationProject | null> {
    const data = await this.read();
    return data.projects.find((project) => project.shareId === shareId) ?? null;
  }

  async listAuditEvents(projectId: string, limit = 50): Promise<CollaborationAuditEvent[] | null> {
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 50;
    return [...project.auditEvents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, safeLimit);
  }

  private appendAuditEvent(
    project: CollaborationProject,
    event: {
      type: CollaborationAuditEventType;
      actorUserId: string;
      metadata?: Record<string, string | number | boolean | null | undefined>;
    }
  ): void {
    project.auditEvents.unshift({
      eventId: randomUUID(),
      type: event.type,
      actorUserId: event.actorUserId,
      createdAt: nowIso(),
      metadata: event.metadata
    });

    if (project.auditEvents.length > 300) {
      project.auditEvents = project.auditEvents.slice(0, 300);
    }
  }

  private async read(): Promise<CollaborationStoreData> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as CollaborationStoreData;
      if (!Array.isArray(parsed.projects)) {
        return { projects: [] };
      }
      for (const project of parsed.projects) {
        if (!Array.isArray(project.generationIds)) {
          project.generationIds = [];
        }
        if (!Array.isArray(project.auditEvents)) {
          project.auditEvents = [];
        }
        if (!Array.isArray(project.members) || project.members.length === 0) {
          project.members = [
            {
              userId: "local-user",
              role: "owner",
              addedAt: project.createdAt ?? nowIso()
            }
          ];
        }
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
