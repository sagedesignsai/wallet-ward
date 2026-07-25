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

    const documents = await prisma.document.findMany({
      where: {
        project: { organizationId: orgCtx.organizationId },
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return json({
      data: documents.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        title: d.title,
        content: d.content,
        createdById: d.createdById,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        project: d.project,
        createdBy: d.createdBy,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
