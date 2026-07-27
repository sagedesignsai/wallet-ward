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
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/branches
 * List branches from the connected repository
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
          `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/branches?per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        )

        if (res.ok) {
          const branches = await res.json()
          return NextResponse.json({
            data: branches.map(
              (branch: { name: string; commit: { sha: string; url: string }; protected: boolean }) => ({
                name: branch.name,
                sha: branch.commit.sha,
                protected: branch.protected,
              })
            ),
          })
        }
      } catch (error) {
        console.error("GitHub API error fetching branches:", error)
        // Fall through to fallback
      }
    }

    // Fallback: return default branch info from the repository record
    return NextResponse.json({
      data: [
        {
          name: repository.branch,
          sha: null,
          protected: false,
          fallback: true,
        },
      ],
    })
  } catch (error) {
    console.error("Error fetching branches:", error)
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    )
  }
}
