import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { createTaskSchema } from "@/lib/api/validators"
import { listTasks, createTask } from "@/lib/services/tasks"

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const data = await listTasks(projectId)
    return json({ data })
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
    const body = createTaskSchema.parse(await request.json())
    const data = await createTask({
      ctx: orgCtx,
      projectId,
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId ?? undefined,
    })
    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
