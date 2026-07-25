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
    requirePermission(orgCtx.memberRole, "secret:read")

    const url = new URL(request.url)
    const projectId = url.searchParams.get("projectId")
    const environmentId = url.searchParams.get("environmentId")

    const secrets = await prisma.secret.findMany({
      where: {
        project: { organizationId: orgCtx.organizationId },
        ...(projectId ? { projectId } : {}),
        ...(environmentId ? { environmentId } : {}),
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        environment: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return json({
      data: secrets.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        environmentId: s.environmentId,
        name: s.name,
        description: s.description,
        type: s.type,
        currentVersion: s.currentVersion,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        project: s.project,
        environment: s.environment,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
