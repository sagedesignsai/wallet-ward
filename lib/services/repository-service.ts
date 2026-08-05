import { db } from "@/lib/db"
import { notFound } from "@/lib/api/errors"
import { getDecryptedToken } from "@/lib/services/integrations"
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
        metadata: metadata ? (metadata as any) : undefined,
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

// ─── GitHub live sync ─────────────────────────────────────────────────────────

export type SyncRepositoryResult = {
  synced: boolean
  message: string
  data?: {
    defaultBranch: string
    latestCommitSha: string
    latestCommitMessage: string
    latestCommitDate: string
  }
}

const GITHUB_API_BASE = "https://api.github.com"

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "flowspace-sync",
  }
}

async function githubFetchJson(url: string, token: string): Promise<unknown> {
  const res = await fetch(url, { headers: githubHeaders(token) })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const detail = body ? `: ${body.slice(0, 200)}` : ""
    throw new Error(`GitHub API error (${res.status})${detail}`)
  }
  return res.json()
}

function sanitizeErrorMessage(error: unknown): string {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unknown GitHub API error"
  // The token is only ever sent in headers, so it cannot appear in an error
  // message — redact anything that looks like a GitHub credential anyway.
  return message
    .replace(/gh[pousr]_[A-Za-z0-9]{20,}/gi, "[redacted]")
    .slice(0, 500)
}

/**
 * Live-sync a repository against GitHub: fetches the default branch and the
 * latest commit and stores them on the repository row. Only GitHub is
 * supported. GitHub/network failures never throw — the row is marked as
 * errored and `{ synced: false, message }` is returned instead.
 */
export async function syncRepositoryWithGithub(
  repositoryId: string,
  organizationId: string
): Promise<SyncRepositoryResult> {
  // 1. Load the repository, scoped to the organization (via its project)
  const repository = await db.repository.findFirst({
    where: { id: repositoryId, project: { organizationId } },
  })
  if (!repository) {
    throw notFound("Repository not found")
  }

  // 2. Mark as syncing
  await RepositoryService.updateSyncStatus(repositoryId, "syncing")

  // 3. Only GitHub is supported for live sync
  const parsed = RepositoryService.parseGitHubUrl(repository.url)
  if (repository.provider !== "github" || !parsed) {
    await RepositoryService.updateSyncStatus(repositoryId, "error")
    return {
      synced: false,
      message: "Live sync is only supported for GitHub repositories",
    }
  }

  // 4. The project must have an enabled GitHub integration
  const integration = await db.integration.findFirst({
    where: {
      projectId: repository.projectId,
      provider: "github",
      enabled: true,
    },
    include: { project: true },
  })
  if (!integration) {
    await RepositoryService.updateSyncStatus(repositoryId, "error")
    return {
      synced: false,
      message: "No GitHub integration connected to this project",
    }
  }

  try {
    // 5. Decrypt the integration token
    const token = await getDecryptedToken(integration)

    // 6. Fetch repo metadata to learn the default branch
    const repoUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`
    const repoData = (await githubFetchJson(repoUrl, token)) as {
      default_branch?: string
    }
    const defaultBranch = repoData.default_branch ?? "main"

    // 7. Fetch the latest commit on the default branch
    const commitsUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(defaultBranch)}&per_page=1`
    const commits = (await githubFetchJson(commitsUrl, token)) as Array<{
      sha: string
      commit: {
        message: string
        author: { date: string }
      }
    }>
    const latest = commits[0]
    if (!latest) {
      throw new Error("GitHub repository has no commits yet")
    }

    // 8. Persist the sync result (merge into existing metadata)
    const existingMetadata =
      repository.metadata &&
      typeof repository.metadata === "object" &&
      !Array.isArray(repository.metadata)
        ? (repository.metadata as Record<string, unknown>)
        : {}

    await RepositoryService.updateSyncStatus(repositoryId, "synced", {
      ...existingMetadata,
      defaultBranch,
      latestCommit: {
        sha: latest.sha,
        message: latest.commit.message,
        date: latest.commit.author.date,
      },
      syncedVia: "github-api",
    })

    // Only replace the "main" placeholder branch with the real default branch;
    // never clobber a branch the user chose explicitly.
    if (repository.branch === "main" && defaultBranch !== "main") {
      await RepositoryService.update(repositoryId, { branch: defaultBranch })
    }

    return {
      synced: true,
      message: "Repository synced successfully",
      data: {
        defaultBranch,
        latestCommitSha: latest.sha,
        latestCommitMessage: latest.commit.message,
        latestCommitDate: latest.commit.author.date,
      },
    }
  } catch (error) {
    // 9. GitHub/network error — mark errored, keep lastSyncAt, never leak token
    await RepositoryService.updateSyncStatus(repositoryId, "error")
    return { synced: false, message: sanitizeErrorMessage(error) }
  }
}
