import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { updateSecretMetaSchema } from "@/lib/api/validators"
import { prisma } from "@/lib/db"
import { writeAuditLog } from "@/lib/services/audit"
import {
  deleteSecret,
  getSecretOrThrow,
  toSecretDto,
} from "@/lib/services/secrets"

type Ctx = { params: Promise<{ secretId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:read")
    const secret = await getSecretOrThrow(secretId, orgCtx.organizationId)
    return json({ data: toSecretDto(secret) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:write")
    await getSecretOrThrow(secretId, orgCtx.organizationId)
    const body = updateSecretMetaSchema.parse(await request.json())

    const updated = await prisma.secret.update({
      where: { id: secretId },
      data: {
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.metadata !== undefined
          ? {
              metadata:
                body.metadata === null
                  ? { set: null }
                  : (body.metadata as object),
            }
          : {}),
      },
    })

    await writeAuditLog({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      action: "secret_update",
      resourceType: "secret",
      resourceId: secretId,
      metadata: { name: updated.name },
    })

    return json({ data: toSecretDto(updated) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { secretId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:delete")
    await deleteSecret({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      secretId,
    })
    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
