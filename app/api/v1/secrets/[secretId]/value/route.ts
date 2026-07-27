import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { putSecretValueSchema } from "@/lib/api/validators"
import { putSecretValue, revealSecretValue } from "@/lib/services/secrets"

type Ctx = { params: Promise<{ secretId: string }> }

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:reveal")

    const url = new URL(request.url)
    const versionParam = url.searchParams.get("version")
    const version = versionParam ? Number(versionParam) : undefined

    const data = await revealSecretValue({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      secretId,
      version: Number.isFinite(version) ? version : undefined,
    })

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:write")
    const body = putSecretValueSchema.parse(await request.json())

    const data = await putSecretValue({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      secretId,
      value: body.value,
      contentType: body.contentType,
    })

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}
