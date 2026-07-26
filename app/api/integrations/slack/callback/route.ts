import { NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import { consumeOAuthState, storeEncryptedToken } from "@/lib/services/integrations"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/?error=missing_oauth_params", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      )
    }

    // Validate state and extract projectId
    const projectId = await consumeOAuthState(state)

    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/?error=slack_oauth_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/slack/callback`

    // Exchange code for access token
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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
      ok: boolean
      access_token?: string
      scope?: string
      team?: { id: string; name: string }
      authed_user?: { id: string }
      error?: string
    }

    if (!tokenData.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(tokenData.error ?? "token_exchange_failed")}`,
          appUrl
        )
      )
    }

    // Look up the project to get the organizationId for encryption
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      return NextResponse.redirect(
        new URL("/?error=project_not_found", appUrl)
      )
    }

    // Parse scopes
    const scopes = tokenData.scope ? tokenData.scope.split(",") : []

    // Create the integration record
    const integration = await prisma.integration.create({
      data: {
        projectId,
        provider: "slack",
        name: tokenData.team?.name ? `Slack (${tokenData.team.name})` : "Slack",
        scopes,
        metadata: {
          teamId: tokenData.team?.id ?? null,
          teamName: tokenData.team?.name ?? null,
          scope: tokenData.scope ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    })

    // Store encrypted access token
    await storeEncryptedToken(integration.id, tokenData.access_token, project.organizationId, "access")

    // Redirect to the project page
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}?integration=connected`, appUrl)
    )
  } catch (error) {
    console.error("Slack OAuth callback error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    return NextResponse.redirect(
      new URL("/?error=callback_failed", appUrl)
    )
  }
}
