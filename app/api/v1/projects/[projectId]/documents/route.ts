import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { createDocumentSchema } from "@/lib/api/validators"
import {
  listDocuments,
  createDocument,
  getDocument,
} from "@/lib/services/documents"

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const data = await listDocuments(projectId, orgCtx.organizationId!)
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
    const body = createDocumentSchema.parse(await request.json())
    const data = await createDocument({
      ctx: orgCtx,
      projectId,
      title: body.title,
      content: body.content,
    })
    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
