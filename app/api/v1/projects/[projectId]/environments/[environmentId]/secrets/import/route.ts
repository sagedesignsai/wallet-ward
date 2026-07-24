import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { handleRouteError, json } from "@/lib/api/http"
import { importSecretsSchema } from "@/lib/api/validators"
import { importSecrets } from "@/lib/services/secrets"

type Ctx = {
  params: Promise<{ projectId: string; environmentId: string }>
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, environmentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:write")

    const body = importSecretsSchema.parse(await request.json())

    try {
      const data = await importSecrets({
        ctx: orgCtx,
        organizationId: orgCtx.organizationId,
        projectId,
        environmentId,
        format: body.format,
        data: body.data,
        overwrite: body.overwrite,
      })
      return json({ data })
    } catch (e) {
      if (e instanceof Error && e.message.includes("must")) {
        throw badRequest(e.message)
      }
      throw e
    }
  } catch (error) {
    return handleRouteError(error)
  }
}
