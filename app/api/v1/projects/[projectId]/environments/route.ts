import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { createEnvironmentSchema } from "@/lib/api/validators"
import { createEnvironment, getProject } from "@/lib/services/projects"

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const project = await getProject(projectId, orgCtx.organizationId)
    return json({ data: project.environments ?? [] })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    const body = createEnvironmentSchema.parse(await request.json())
    const data = await createEnvironment({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      projectId,
      name: body.name,
      slug: body.slug,
      description: body.description,
    })
    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
