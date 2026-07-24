import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { updateProjectSchema } from "@/lib/api/validators"
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/services/projects"

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const data = await getProject(projectId, orgCtx.organizationId)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    const body = updateProjectSchema.parse(await request.json())
    const data = await updateProject({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      projectId,
      name: body.name,
      description: body.description,
    })
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    await deleteProject({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      projectId,
    })
    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
