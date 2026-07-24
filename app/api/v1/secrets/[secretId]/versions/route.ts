import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { listSecretVersions } from "@/lib/services/secrets"

type Ctx = { params: Promise<{ secretId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:read")
    const data = await listSecretVersions(secretId, orgCtx.organizationId)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}
