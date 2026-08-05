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

type GitHubContentItem = {
  name: string
  path: string
  type: string
  size: number | null
  sha: string
  download_url: string | null
  html_url: string
}

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/tree/...path
 * Browse repository file tree at a given path
 *
 * Query params:
 *   ?ref=main  — branch or ref to browse (default: repository's default branch)
 */
export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; repositoryId: string; path: string[] }>
  }
) {
  try {
    const { projectId, repositoryId, path } = await params
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

    // Build the file path from the catch-all segment
    const filePath = path ? path.join("/") : ""

    // Parse query params
    const url = new URL(req.url)
    const ref = url.searchParams.get("ref") || repository.branch || "main"

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

      const endpoint = filePath
        ? `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(ref)}`
        : `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents?ref=${encodeURIComponent(ref)}`

      res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
    } catch (error) {
      console.error("GitHub API error fetching tree:", error)
      return githubError(
        "GitHub API error — token may be revoked or lack access"
      )
    }

    if (!res.ok) {
      return githubError(
        `GitHub API error: ${res.status} — token may be revoked or lack access`
      )
    }

    const contents = (await res.json()) as
      | GitHubContentItem
      | GitHubContentItem[]

    // GitHub returns an array for directories, an object for single files
    const items = Array.isArray(contents) ? contents : [contents]

    return json({
      data: items.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type, // "file", "dir", "symlink", "submodule"
        size: item.size,
        sha: item.sha,
        downloadUrl: item.download_url,
        htmlUrl: item.html_url,
      })),
      meta: {
        path: filePath || "/",
        ref,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
