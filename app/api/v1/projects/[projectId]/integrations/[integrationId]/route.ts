import { z } from "zod"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import {
  getIntegration,
  deleteIntegration,
  updateIntegration,
  toIntegrationDto,
} from "@/lib/services/integrations"

type Ctx = { params: Promise<{ projectId: string; integrationId: string }> }

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
})

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { integrationId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const integration = await getIntegration(
      integrationId,
      orgCtx.organizationId
    )
    return json({ data: toIntegrationDto(integration) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { integrationId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    const body = updateSchema.parse(await request.json())
    const data = await updateIntegration({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      integrationId,
      enabled: body.enabled,
      name: body.name,
    })
    return json({ data })
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
