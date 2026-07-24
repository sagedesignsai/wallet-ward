import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const orgCtx = await requireOrganization(ctx)
    requirePermission(orgCtx.memberRole, "audit:read")

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200)
    const cursor = url.searchParams.get("cursor")

    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgCtx.organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        actorType: true,
        actorUserId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    })

    return json({
      data: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      nextCursor: logs.length === limit ? logs[logs.length - 1]?.id : null,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
