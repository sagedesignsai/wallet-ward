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

    const clientId = process.env.GITLAB_CLIENT_ID
    const clientSecret = process.env.GITLAB_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/?error=gitlab_oauth_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/gitlab/callback`

    // Exchange code for access token
    const tokenRes = await fetch("https://gitlab.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
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

    // Fetch GitLab user info for the integration name
    const userRes = await fetch("https://gitlab.com/api/v4/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    const gitlabUser = userRes.ok
      ? ((await userRes.json()) as { username?: string })
      : null

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
    const scopes = tokenData.scope ? tokenData.scope.split(" ") : []

    // Calculate token expiry
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null

    // Create the integration record
    const integration = await prisma.integration.create({
      data: {
        projectId,
        provider: "gitlab",
        name: gitlabUser?.username ? `GitLab (${gitlabUser.username})` : "GitLab",
        scopes,
        tokenExpiresAt,
        metadata: {
          gitlabUser: gitlabUser?.username ?? null,
          scope: tokenData.scope ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    })

    // Store encrypted access token
    await storeEncryptedToken(integration.id, tokenData.access_token, project.organizationId, "access")

    // Store encrypted refresh token if provided
    if (tokenData.refresh_token) {
      await storeEncryptedToken(integration.id, tokenData.refresh_token, project.organizationId, "refresh")
    }

    // Redirect to the project page
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}?integration=connected`, appUrl)
    )
  } catch (error) {
    console.error("GitLab OAuth callback error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    return NextResponse.redirect(
      new URL("/?error=callback_failed", appUrl)
    )
  }
}
