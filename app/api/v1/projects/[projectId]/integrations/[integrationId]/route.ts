import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import {
  getIntegration,
  deleteIntegration,
  toIntegrationDto,
} from "@/lib/services/integrations"

type Ctx = { params: Promise<{ projectId: string; integrationId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { integrationId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const integration = await getIntegration(integrationId, orgCtx.organizationId)
    return json({ data: toIntegrationDto(integration) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { integrationId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    await deleteIntegration({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      integrationId,
    })
    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
