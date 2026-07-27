import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import {
  slackConnectSchema,
  createOAuthState,
} from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = slackConnectSchema.parse(await request.json())

    const clientId = process.env.SLACK_CLIENT_ID
    if (!clientId) {
      throw badRequest("Slack OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/slack/callback`

    const authorizationUrl = new URL("https://slack.com/oauth/v2/authorize")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set(
      "scope",
      "chat:write,channels:read,users:read"
    )
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
