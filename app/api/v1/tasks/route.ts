import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const url = new URL(request.url)
    const projectId = url.searchParams.get("projectId")
    const status = url.searchParams.get("status") as
      | "todo"
      | "in_progress"
      | "done"
      | null

    const validStatuses = ["todo", "in_progress", "done"] as const
    const statusFilter =
      status && validStatuses.includes(status) ? status : null

    const tasks = await prisma.task.findMany({
      where: {
        project: { organizationId: orgCtx.organizationId },
        ...(projectId ? { projectId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return json({
      data: tasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        status: t.status,
        assigneeId: t.assigneeId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        project: t.project,
        assignee: t.assignee,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
