import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import {
  jiraConnectSchema,
  createOAuthState,
} from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = jiraConnectSchema.parse(await request.json())

    const clientId = process.env.JIRA_CLIENT_ID
    if (!clientId) {
      throw badRequest("Jira OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/jira/callback`

    // Jira uses OAuth 2.0 (3LO) - requires cloud instance
    const authorizationUrl = new URL("https://auth.atlassian.com/authorize")
    authorizationUrl.searchParams.set("audience", "api.atlassian.com")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set(
      "scope",
      "read:jira-work write:jira-work read:jira-user offline_access"
    )
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)
    authorizationUrl.searchParams.set("response_type", "code")
    authorizationUrl.searchParams.set("prompt", "consent")

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
