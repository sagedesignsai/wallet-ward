import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"

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
    const { projectId } = await params
    const { searchParams } = new URL(req.url)

    const rootPath = searchParams.get("path") || "/"

    await requireProjectAccess(projectId, "project:read")

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

    return json({ data: tree })
  } catch (error) {
    return handleRouteError(error)
  }
}
