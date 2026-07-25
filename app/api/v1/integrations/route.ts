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

    const integrations = await prisma.integration.findMany({
      where: {
        project: { organizationId: orgCtx.organizationId },
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return json({
      data: integrations.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        provider: i.provider,
        name: i.name,
        enabled: i.enabled,
        metadata: i.metadata,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        project: i.project,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
