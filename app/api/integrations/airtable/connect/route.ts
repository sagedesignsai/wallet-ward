import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError } from "@/lib/api/http"
import {
  airtableConnectSchema,
  createOAuthState,
} from "@/lib/services/integrations"
import { badRequest } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const body = airtableConnectSchema.parse(await request.json())

    const clientId = process.env.AIRTABLE_CLIENT_ID
    if (!clientId) {
      throw badRequest("Airtable OAuth is not configured")
    }

    const state = await createOAuthState(body.projectId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/airtable/callback`

    // Airtable OAuth 2.0
    const authorizationUrl = new URL("https://airtable.com/oauth2/v1/authorize")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)
    authorizationUrl.searchParams.set("response_type", "code")
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set(
      "scope",
      "data.records:read data.records:write schema.bases:read"
    )

    return NextResponse.json({
      url: authorizationUrl.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
