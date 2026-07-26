import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import { gitlabConnectSchema, createOAuthState } from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = gitlabConnectSchema.parse(await request.json())

    const clientId = process.env.GITLAB_CLIENT_ID
    if (!clientId) {
      throw badRequest("GitLab OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/gitlab/callback`

    const authorizationUrl = new URL("https://gitlab.com/oauth/authorize")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set("scope", "api read_user read_repository write_repository")
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)
    authorizationUrl.searchParams.set("response_type", "code")

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
