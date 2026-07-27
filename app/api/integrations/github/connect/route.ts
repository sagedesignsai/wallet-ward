import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import {
  githubConnectSchema,
  createOAuthState,
} from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = githubConnectSchema.parse(await request.json())

    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      throw badRequest("GitHub OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/github/callback`

    const authorizationUrl = new URL("https://github.com/login/oauth/authorize")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set("scope", "repo,read:org")
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
