import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { verifyAuditChain } from "@/lib/services/audit"

export async function GET() {
  try {
    const ctx = await requireAuth()
    const orgCtx = await requireOrganization(ctx)
    requirePermission(orgCtx.memberRole, "audit:read")

    const result = await verifyAuditChain(orgCtx.organizationId)

    return json({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
