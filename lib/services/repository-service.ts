import { db } from "@/lib/db"
import type { 
  Repository, 
  RepositoryProvider, 
  RepositoryAccessType,
  RepositorySyncStatus 
} from "@prisma/client"

export type CreateRepositoryInput = {
  projectId: string
  name: string
  description?: string
  provider: RepositoryProvider
  url: string
  branch?: string
  accessType: RepositoryAccessType
  credentialId?: string
  createdById?: string
}

export type UpdateRepositoryInput = {
  name?: string
  description?: string
  branch?: string
  accessType?: RepositoryAccessType
  credentialId?: string
}

export type RepositoryWithMetadata = Repository & {
  _count?: {
    webhooks: number
  }
}

export class RepositoryService {
  /**
   * Create a new repository
   */
  static async create(input: CreateRepositoryInput): Promise<Repository> {
    return db.repository.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        provider: input.provider,
        url: input.url,
        branch: input.branch || "main",
        accessType: input.accessType,
        credentialId: input.credentialId,
        createdById: input.createdById,
        syncStatus: "never_synced",
      },
    })
  }

  /**
   * Get repository by ID
   */
  static async getById(id: string): Promise<Repository | null> {
    return db.repository.findUnique({
      where: { id },
    })
  }

  /**
   * Get repository by ID with webhooks count
   */
  static async getByIdWithMetadata(id: string): Promise<RepositoryWithMetadata | null> {
    return db.repository.findUnique({
      where: { id },
      include: {
        _count: {
          select: { webhooks: true },
        },
      },
    })
  }

  /**
   * List repositories for a project
   */
  static async listByProject(projectId: string): Promise<Repository[]> {
    return db.repository.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * List repositories for a project with metadata
   */
  static async listByProjectWithMetadata(
    projectId: string
  ): Promise<RepositoryWithMetadata[]> {
    return db.repository.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { webhooks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Update repository
   */
  static async update(
    id: string,
    input: UpdateRepositoryInput
  ): Promise<Repository> {
    return db.repository.update({
      where: { id },
      data: input,
    })
  }

  /**
   * Update sync status
   */
  static async updateSyncStatus(
    id: string,
    status: RepositorySyncStatus,
    metadata?: Record<string, unknown>
  ): Promise<Repository> {
    return db.repository.update({
      where: { id },
      data: {
        syncStatus: status,
        lastSyncAt: status === "synced" ? new Date() : undefined,
        metadata: metadata ? metadata : undefined,
      },
    })
  }

  /**
   * Delete repository
   */
  static async delete(id: string): Promise<Repository> {
    return db.repository.delete({
      where: { id },
    })
  }

  /**
   * Check if repository exists in project
   */
  static async existsInProject(
    projectId: string,
    url: string
  ): Promise<boolean> {
    const count = await db.repository.count({
      where: {
        projectId,
        url,
      },
    })
    return count > 0
  }

  /**
   * Get repositories by provider
   */
  static async listByProvider(
    projectId: string,
    provider: RepositoryProvider
  ): Promise<Repository[]> {
    return db.repository.findMany({
      where: {
        projectId,
        provider,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Webhook CRUD
   */
  static async listWebhooks(repositoryId: string) {
    return db.repositoryWebhook.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
    })
  }

  static async createWebhook(
    repositoryId: string,
    input: { event: string; url: string; enabled?: boolean }
  ) {
    const secret = crypto.randomUUID()
    return db.repositoryWebhook.create({
      data: {
        repositoryId,
        event: input.event as any,
        url: input.url,
        secret,
        enabled: input.enabled ?? true,
      },
    })
  }

  static async deleteWebhook(id: string) {
    return db.repositoryWebhook.delete({ where: { id } })
  }

  static async getWebhook(id: string) {
    return db.repositoryWebhook.findUnique({ where: { id } })
  }

  /**
   * Parse a GitHub URL to extract owner/repo
   */
  static parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
    return null
  }

  /**
   * Parse a GitLab URL to extract group/project
   */
  static parseGitLabUrl(url: string): { group: string; project: string } | null {
    const match = url.match(/gitlab\.com\/([^/]+(?:\/[^/]+)*)\/([^/]+?)(?:\.git)?$/)
    if (match) return { group: match[1], project: match[2] }
    return null
  }

  /**
   * Get repository statistics for a project
   */
  static async getProjectStats(projectId: string) {
    const [total, byProvider, bySyncStatus] = await Promise.all([
      db.repository.count({ where: { projectId } }),
      db.repository.groupBy({
        by: ["provider"],
        where: { projectId },
        _count: true,
      }),
      db.repository.groupBy({
        by: ["syncStatus"],
        where: { projectId },
        _count: true,
      }),
    ])

    return {
      total,
      byProvider: byProvider.reduce(
        (acc, item) => {
          acc[item.provider] = item._count
          return acc
        },
        {} as Record<string, number>
      ),
      bySyncStatus: bySyncStatus.reduce(
        (acc, item) => {
          acc[item.syncStatus] = item._count
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }
}
