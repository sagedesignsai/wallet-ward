import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { exportQuerySchema } from "@/lib/api/validators"
import { exportSecrets } from "@/lib/services/secrets"

type Ctx = {
  params: Promise<{ projectId: string; environmentId: string }>
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId, environmentId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "secret:reveal")

    const url = new URL(request.url)
    const query = exportQuerySchema.parse({
      format: url.searchParams.get("format") ?? "json",
    })

    const result = await exportSecrets({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      projectId,
      environmentId,
      format: query.format,
    })

    if (result.format === "dotenv") {
      return new Response(result.body, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-secret-count": String(result.count),
        },
      })
    }

    return json({ data: result.body, count: result.count })
  } catch (error) {
    return handleRouteError(error)
  }
}
