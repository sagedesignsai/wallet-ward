import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import { trelloConnectSchema, createOAuthState } from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = trelloConnectSchema.parse(await request.json())

    const apiKey = process.env.TRELLO_API_KEY
    if (!apiKey) {
      throw badRequest("Trello OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const callbackUrl = `${appUrl}/api/integrations/trello/callback`

    // Trello uses OAuth 1.0a
    const authorizationUrl = new URL("https://trello.com/1/authorize")
    authorizationUrl.searchParams.set("key", apiKey)
    authorizationUrl.searchParams.set("name", "Flowspace")
    authorizationUrl.searchParams.set("scope", "read,write")
    authorizationUrl.searchParams.set("expiration", "never")
    authorizationUrl.searchParams.set("response_type", "token")
    authorizationUrl.searchParams.set("return_url", `${callbackUrl}?state=${state}`)

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
