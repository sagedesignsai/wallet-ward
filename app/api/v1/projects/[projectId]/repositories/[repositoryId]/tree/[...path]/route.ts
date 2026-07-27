import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getDecryptedToken } from "@/lib/services/integrations"

/**
 * Parse a GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
  return null
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
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, repositoryId, path } = await params

    // Verify project access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!project || project.organization.members.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify repository exists and belongs to project
    const repository = await RepositoryService.getById(repositoryId)
    if (!repository || repository.projectId !== projectId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      )
    }

    // Build the file path from the catch-all segment
    const filePath = path ? path.join("/") : ""

    // Parse query params
    const url = new URL(req.url)
    const ref = url.searchParams.get("ref") || repository.branch

    // Parse GitHub URL
    const parsed = parseGitHubUrl(repository.url)
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Unsupported repository URL. Only GitHub repositories are supported.",
        },
        { status: 400 }
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

    if (integration) {
      try {
        const token = await getDecryptedToken(integration)

        const endpoint = filePath
          ? `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(ref)}`
          : `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents?ref=${encodeURIComponent(ref)}`

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        })

        if (res.ok) {
          const contents = await res.json()

          // GitHub returns an array for directories, an object for single files
          const items = Array.isArray(contents) ? contents : [contents]

          return NextResponse.json({
            data: items.map(
              (item: {
                name: string
                path: string
                type: string
                size: number | null
                sha: string
                download_url: string | null
                html_url: string
              }) => ({
                name: item.name,
                path: item.path,
                type: item.type, // "file", "dir", "symlink", "submodule"
                size: item.size,
                sha: item.sha,
                downloadUrl: item.download_url,
                htmlUrl: item.html_url,
              })
            ),
            meta: {
              path: filePath || "/",
              ref,
            },
          })
        }
      } catch (error) {
        console.error("GitHub API error fetching tree:", error)
        // Fall through to fallback
      }
    }

    // Fallback: return empty array if API unavailable
    return NextResponse.json({
      data: [],
      meta: {
        path: filePath || "/",
        ref,
        fallback: true,
      },
    })
  } catch (error) {
    console.error("Error fetching repository tree:", error)
    return NextResponse.json(
      { error: "Failed to fetch repository tree" },
      { status: 500 }
    )
  }
}
