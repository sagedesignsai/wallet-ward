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

type GitHubBranch = {
  name: string
  commit: { sha: string }
  protected: boolean
}

type GitHubCommitItem = {
  commit: {
    message: string
    author: { date: string } | null
  }
}

type MappedBranch = {
  name: string
  sha: string
  protected: boolean
  isDefault: boolean
  lastCommit: { message: string; date: string } | null
}

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/branches
 * List branches from the connected repository
 */
export async function GET(
  _req: NextRequest,
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

    let token: string
    let branchesRes: Response
    try {
      token = await getDecryptedToken(integration)
      branchesRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/branches?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      )
    } catch (error) {
      console.error("GitHub API error fetching branches:", error)
      return githubError(
        "GitHub API error — token may be revoked or lack access"
      )
    }

    if (!branchesRes.ok) {
      return githubError(
        `GitHub API error: ${branchesRes.status} — token may be revoked or lack access`
      )
    }

    const branches = (await branchesRes.json()) as GitHubBranch[]

    // Determine the default branch from the repo; fall back to the
    // repository's configured branch if the repo fetch fails.
    let defaultBranch = repository.branch || "main"
    try {
      const repoRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      )
      if (repoRes.ok) {
        const repo = (await repoRes.json()) as { default_branch?: string }
        if (repo.default_branch) defaultBranch = repo.default_branch
      }
    } catch (error) {
      console.error("GitHub API error fetching repo default branch:", error)
      // fall back to the repository's configured branch
    }

    // Fetch the latest commit for each branch in parallel. Failures on
    // individual branches are tolerated (lastCommit stays null).
    const lastCommitResponses = await Promise.allSettled(
      branches.map((branch) =>
        fetch(
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(branch.name)}&per_page=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        )
      )
    )

    const data: MappedBranch[] = await Promise.all(
      branches.map(async (branch, index) => {
        const result = lastCommitResponses[index]
        let lastCommit: { message: string; date: string } | null = null

        if (result && result.status === "fulfilled" && result.value.ok) {
          const commitItems = (await result.value.json()) as GitHubCommitItem[]
          const head = commitItems[0]
          if (head?.commit) {
            lastCommit = {
              message: head.commit.message,
              date: head.commit.author?.date ?? "",
            }
          }
        }

        return {
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
          isDefault: branch.name === defaultBranch,
          lastCommit,
        }
      })
    )

    return json({
      data,
      meta: { total: data.length },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
