import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { createProjectSchema } from "@/lib/api/validators"
import { createProject, listProjects } from "@/lib/services/projects"

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const url = new URL(request.url)
    const organizationId = url.searchParams.get("organizationId") ?? undefined
    const orgCtx = await requireOrganization(ctx, organizationId)
    requirePermission(orgCtx.memberRole, "project:read")

    const data = await listProjects(orgCtx.organizationId)
    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    const body = createProjectSchema.parse(await request.json())
    const orgCtx = await requireOrganization(ctx, body.organizationId)
    requirePermission(orgCtx.memberRole, "project:write")

    const data = await createProject({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      name: body.name,
      slug: body.slug,
      description: body.description,
    })

    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
