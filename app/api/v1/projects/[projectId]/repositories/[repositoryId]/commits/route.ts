import { NextRequest } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, notFound } from "@/lib/api/errors"
import { RepositoryService } from "@/lib/services/repository-service"
import { db } from "@/lib/db"
import { getDecryptedToken } from "@/lib/services/integrations"

/**
 * Parse a GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (
    parsed.hostname !== "github.com" &&
    parsed.hostname !== "www.github.com"
  ) {
    return null
  }
  const parts = parsed.pathname
    .replace(/^\/+/, "")
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean)
  if (parts.length !== 2) return null
  return { owner: parts[0], repo: parts[1] }
}

function githubError(message: string) {
  return json(
    { error: { code: "github_api_error", message } },
    { status: 502 }
  )
}

type GitHubCommitItem = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; email: string; date: string } | null
  }
  author: { name?: string | null; login?: string } | null
}

type MappedCommit = {
  sha: string
  message: string
  author: { name: string }
  commit: {
    message: string
    author: { name: string | null; email: string | null; date: string | null }
  }
  html_url: string
}

/**
 * Map a GitHub commits API item to the shape the commits UI expects.
 * Keeps the nested GitHub `commit` object and adds the top-level
 * `message`/`author` convenience fields consumed by commit-list.tsx.
 */
function mapCommit(commit: GitHubCommitItem): MappedCommit {
  return {
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name:
        commit.commit.author?.name ??
        commit.author?.name ??
        commit.author?.login ??
        "Unknown",
    },
    commit: {
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name ?? null,
        email: commit.commit.author?.email ?? null,
        date: commit.commit.author?.date ?? null,
      },
    },
    html_url: commit.html_url,
  }
}

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/commits
 * List recent commits from the connected repository
 *
 * Query params:
 *   ?branch=main  — branch or ref to list commits from (default: repository's default branch)
 *   ?limit=30     — max number of commits to return (default: 30, max: 100)
 *   ?cursor=1     — GitHub page number for pagination (default: 1)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; repositoryId: string }> }
) {
  try {
    const { projectId, repositoryId } = await params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    // Verify the project belongs to the active organization
    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    // Verify repository exists and belongs to project
    const repository = await RepositoryService.getById(repositoryId)
    if (!repository || repository.projectId !== projectId) {
      throw notFound("Repository not found")
    }

    // Parse query params
    const url = new URL(req.url)
    const branch = url.searchParams.get("branch") || repository.branch || "main"
    const limitParam = parseInt(url.searchParams.get("limit") || "30", 10)
    const limit = Math.min(Math.max(limitParam, 1), 100)
    const cursorParam = parseInt(url.searchParams.get("cursor") || "1", 10)
    const page = Math.max(Number.isFinite(cursorParam) ? cursorParam : 1, 1)

    // Parse GitHub URL
    const parsed = parseGitHubUrl(repository.url)
    if (!parsed) {
      throw badRequest(
        "Unsupported repository URL. Only GitHub repositories are supported."
      )
    }

    // Find GitHub integration and decrypt token
    const integration = await db.integration.findFirst({
      where: {
        projectId,
        provider: "github",
        enabled: true,
      },
      include: { project: true },
    })

    if (!integration) {
      return githubError(
        "GitHub integration is not configured for this project"
      )
    }

    let res: Response
    try {
      const token = await getDecryptedToken(integration)
      res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      )
    } catch (error) {
      console.error("GitHub API error fetching commits:", error)
      return githubError(
        "GitHub API error — token may be revoked or lack access"
      )
    }

    if (!res.ok) {
      return githubError(
        `GitHub API error: ${res.status} — token may be revoked or lack access`
      )
    }

    const items = (await res.json()) as GitHubCommitItem[]
    const hasNextPage = /rel="next"/.test(res.headers.get("link") ?? "")

    return json({
      data: items.map(mapCommit),
      meta: {
        branch,
        limit,
      },
      next: hasNextPage ? String(page + 1) : null,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
