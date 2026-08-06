import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { prisma } from "@/lib/db"
import { writeAuditLog } from "@/lib/services/audit"

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const orgCtx = await requireOrganization(ctx)
    requirePermission(orgCtx.memberRole, "audit:read")

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200)
    const cursor = url.searchParams.get("cursor")

    // Chain-stable ordering: orgSeq desc primary, createdAt desc secondary
    // (during the migration window unchained rows have orgSeq null and sort
    // by recency via the createdAt fallback), id desc as the keyset-stable
    // tiebreaker for cursor pagination.
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgCtx.organizationId },
      orderBy: [{ orgSeq: "desc" }, { createdAt: "desc" }, { id: "desc" }],
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

    // Reading the audit log is itself audited (GDPR Art. 30). Non-recursive:
    // writeAuditLog never triggers further audit writes. Failures are logged
    // loudly but must not fail the GET response.
    writeAuditLog({
      ctx,
      organizationId: orgCtx.organizationId,
      action: "audit_log_read",
      resourceType: "audit_log",
      resourceId: orgCtx.organizationId,
      metadata: { count: logs.length, limit },
    }).catch((error) => {
      console.error(
        "[audit] audit_log_read write failed (org=%s, count=%d):",
        orgCtx.organizationId,
        logs.length,
        error
      )
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
