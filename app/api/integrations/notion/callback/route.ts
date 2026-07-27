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

    const clientId = process.env.NOTION_CLIENT_ID
    const clientSecret = process.env.NOTION_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          "/?error=notion_oauth_not_configured",
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        )
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/integrations/notion/callback`

    // Exchange code for access token
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    )

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      workspace_name?: string
      workspace_id?: string
      workspace_icon?: string
      bot_id?: string
      owner?: { type: string; user?: { id: string; name?: string } }
      error?: string
    }

    if (!tokenData.access_token) {
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
      return NextResponse.redirect(new URL("/?error=project_not_found", appUrl))
    }

    // Create the integration record
    const integration = await prisma.integration.create({
      data: {
        projectId,
        provider: "notion",
        name: tokenData.workspace_name
          ? `Notion (${tokenData.workspace_name})`
          : "Notion",
        scopes: [], // Notion doesn't use traditional scopes
        metadata: {
          workspaceId: tokenData.workspace_id ?? null,
          workspaceName: tokenData.workspace_name ?? null,
          workspaceIcon: tokenData.workspace_icon ?? null,
          botId: tokenData.bot_id ?? null,
          owner: tokenData.owner ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    })

    // Store encrypted access token (Notion tokens don't expire)
    await storeEncryptedToken(
      integration.id,
      tokenData.access_token,
      project.organizationId,
      "access"
    )

    // Redirect to the project page
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}?integration=connected`, appUrl)
    )
  } catch (error) {
    console.error("Notion OAuth callback error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    return NextResponse.redirect(new URL("/?error=callback_failed", appUrl))
  }
}
