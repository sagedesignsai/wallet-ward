import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { updateTaskSchema } from "@/lib/api/validators"
import { getTask, updateTask, deleteTask } from "@/lib/services/tasks"

type Ctx = { params: Promise<{ projectId: string; taskId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const data = await getTask(taskId, orgCtx.organizationId!)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    const body = updateTaskSchema.parse(await request.json())
    const data = await updateTask({
      ctx: orgCtx,
      id: taskId,
      title: body.title,
      description: body.description,
      status: body.status,
      ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
    })
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    await deleteTask({ ctx: orgCtx, id: taskId })
    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
