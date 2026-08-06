import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { exportAuditBundle } from "@/lib/services/audit"
import { writeAuditLog } from "@/lib/services/audit"

export async function GET() {
  try {
    const ctx = await requireAuth()
    const orgCtx = await requireOrganization(ctx)
    requirePermission(orgCtx.memberRole, "audit:read")

    const bundle = await exportAuditBundle(orgCtx.organizationId)

    // The export itself is audited (regulated class). Awaited so a failed
    // audit write surfaces instead of silently producing unlogged exports.
    await writeAuditLog({
      ctx,
      organizationId: orgCtx.organizationId,
      action: "audit_export",
      resourceType: "audit_log",
      resourceId: orgCtx.organizationId,
      metadata: {
        recordCount: bundle.records.length,
        exportedAt: new Date().toISOString(),
      },
    })

    return json({ data: bundle })
  } catch (error) {
    return handleRouteError(error)
  }
}
