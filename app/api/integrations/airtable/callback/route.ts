import { NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import {
  consumeOAuthState,
  storeEncryptedToken,
} from "@/lib/services/integrations"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/?error=missing_oauth_params",
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        )
      )
    }

    // Validate state and extract projectId
    const projectId = await consumeOAuthState(state)

    const clientId = process.env.AIRTABLE_CLIENT_ID
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          "/?error=airtable_oauth_not_configured",
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        )
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/airtable/callback`

    // Exchange code for access token
    const tokenRes = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", appUrl)
      )
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      scope?: string
      token_type?: string
      error?: string
      error_description?: string
    }

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(tokenData.error_description ?? "token_exchange_failed")}`,
          appUrl
        )
      )
    }

    // Fetch user info
    const userRes = await fetch("https://api.airtable.com/v0/meta/whoami", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    const userData = userRes.ok ? await userRes.json() : null
    const airtableUser = userData?.id

    // Look up the project to get the organizationId for encryption
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      return NextResponse.redirect(new URL("/?error=project_not_found", appUrl))
    }

    // Parse scopes
    const scopes = tokenData.scope ? tokenData.scope.split(" ") : []

    // Calculate token expiry
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null

    // Create the integration record
    const integration = await prisma.integration.create({
      data: {
        projectId,
        provider: "airtable",
        name: airtableUser ? `Airtable (${airtableUser})` : "Airtable",
        scopes,
        tokenExpiresAt,
        metadata: {
          userId: airtableUser ?? null,
          scope: tokenData.scope ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    })

    // Store encrypted access token
    await storeEncryptedToken(
      integration.id,
      tokenData.access_token,
      project.organizationId,
      "access"
    )

    // Store encrypted refresh token if provided
    if (tokenData.refresh_token) {
      await storeEncryptedToken(
        integration.id,
        tokenData.refresh_token,
        project.organizationId,
        "refresh"
      )
    }

    // Redirect to the project page
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}?integration=connected`, appUrl)
    )
  } catch (error) {
    console.error("Airtable OAuth callback error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    return NextResponse.redirect(new URL("/?error=callback_failed", appUrl))
  }
}
