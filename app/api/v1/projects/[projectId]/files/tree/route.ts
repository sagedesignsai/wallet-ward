import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

type TreeNode = {
  name: string
  path: string
  type: string
  children?: TreeNode[]
}

/**
 * GET /api/v1/projects/:projectId/files/tree
 * Get the folder tree structure for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { searchParams } = new URL(req.url)

    const rootPath = searchParams.get("path") || "/"

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

    const files = await FileService.listByProject(projectId, {
      path: rootPath,
    })

    // Build tree structure from flat file list
    const tree: TreeNode[] = []

    for (const file of files) {
      // Split path into segments relative to rootPath
      const relativePath = file.path.startsWith(rootPath)
        ? file.path.slice(rootPath.length)
        : file.path

      const segments = relativePath.split("/").filter(Boolean)
      if (segments.length === 0) continue

      let currentLevel = tree

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const isLast = i === segments.length - 1
        const segmentPath = rootPath.endsWith("/")
          ? `${rootPath}${segments.slice(0, i + 1).join("/")}`
          : `${rootPath}/${segments.slice(0, i + 1).join("/")}`

        const existing = currentLevel.find((node) => node.name === segment)

        if (existing) {
          if (!existing.children) {
            existing.children = []
          }
          currentLevel = existing.children
        } else {
          const newNode: TreeNode = {
            name: segment,
            path: segmentPath,
            type: isLast ? file.type : "folder",
          }

          if (!isLast) {
            newNode.children = []
          }

          currentLevel.push(newNode)
          if (!isLast) {
            currentLevel = newNode.children!
          }
        }
      }
    }

    return NextResponse.json({ data: tree })
  } catch (error) {
    console.error("Error fetching file tree:", error)
    return NextResponse.json(
      { error: "Failed to fetch file tree" },
      { status: 500 }
    )
  }
}
