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
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/commits
 * List recent commits from the connected repository
 *
 * Query params:
 *   ?branch=main  — branch or ref to list commits from (default: repository's default branch)
 *   ?limit=30     — max number of commits to return (default: 30, max: 100)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; repositoryId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, repositoryId } = await params

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
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    // Parse query params
    const url = new URL(req.url)
    const branch = url.searchParams.get("branch") || repository.branch
    const limitParam = parseInt(url.searchParams.get("limit") || "30", 10)
    const limit = Math.min(Math.max(limitParam, 1), 100)

    // Parse GitHub URL
    const parsed = parseGitHubUrl(repository.url)
    if (!parsed) {
      return NextResponse.json(
        { error: "Unsupported repository URL. Only GitHub repositories are supported." },
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

        const res = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        )

        if (res.ok) {
          const commits = await res.json()
          return NextResponse.json({
            data: commits.map(
              (commit: {
                sha: string
                commit: {
                  message: string
                  author: { name: string; email: string; date: string } | null
                }
              }) => ({
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author
                  ? {
                      name: commit.commit.author.name,
                      email: commit.commit.author.email,
                    }
                  : null,
                date: commit.commit.author?.date ?? null,
              })
            ),
            meta: {
              branch,
              limit,
            },
          })
        }
      } catch (error) {
        console.error("GitHub API error fetching commits:", error)
        // Fall through to fallback
      }
    }

    // Fallback: return empty array if API unavailable
    return NextResponse.json({
      data: [],
      meta: {
        branch,
        limit,
        fallback: true,
      },
    })
  } catch (error) {
    console.error("Error fetching commits:", error)
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 }
    )
  }
}
