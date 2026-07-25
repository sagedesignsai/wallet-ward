import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { updateDocumentSchema } from "@/lib/api/validators"
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/services/documents"

type Ctx = { params: Promise<{ projectId: string; documentId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { documentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    const data = await getDocument(documentId)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { documentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    const body = updateDocumentSchema.parse(await request.json())
    const data = await updateDocument({
      ctx: orgCtx,
      id: documentId,
      title: body.title,
      content: body.content,
    })
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { documentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    await deleteDocument({ ctx: orgCtx, id: documentId })
    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
