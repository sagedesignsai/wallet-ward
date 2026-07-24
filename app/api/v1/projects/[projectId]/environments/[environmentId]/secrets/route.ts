import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { createSecretSchema } from "@/lib/api/validators"
import {
  createSecret,
  getEnvironmentInProject,
  getProjectInOrg,
  listSecrets,
} from "@/lib/services/secrets"

type Ctx = {
  params: Promise<{ projectId: string; environmentId: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId, environmentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:read")
    await getProjectInOrg(projectId, orgCtx.organizationId)
    await getEnvironmentInProject(environmentId, projectId)
    const data = await listSecrets(environmentId)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, environmentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:write")
    const body = createSecretSchema.parse(await request.json())

    const data = await createSecret({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      projectId,
      environmentId,
      name: body.name,
      value: body.value,
      description: body.description,
      type: body.type,
      metadata: body.metadata,
    })

    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
