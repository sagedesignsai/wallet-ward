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
    const token = searchParams.get("token")
    const state = searchParams.get("state")

    if (!token || !state) {
      return NextResponse.redirect(
        new URL(
          "/?error=missing_oauth_params",
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        )
      )
    }

    // Validate state and extract projectId
    const projectId = await consumeOAuthState(state)

    const apiKey = process.env.TRELLO_API_KEY
    if (!apiKey) {
      return NextResponse.redirect(
        new URL(
          "/?error=trello_oauth_not_configured",
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        )
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    // Fetch user info using the token
    const userRes = await fetch(
      `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
    )
    const trelloUser = userRes.ok
      ? ((await userRes.json()) as { username?: string; fullName?: string })
      : null

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
        provider: "trello",
        name: trelloUser?.fullName
          ? `Trello (${trelloUser.fullName})`
          : "Trello",
        scopes: ["read", "write"], // Trello uses simple read/write scopes
        metadata: {
          username: trelloUser?.username ?? null,
          fullName: trelloUser?.fullName ?? null,
          apiKey,
        } satisfies Prisma.InputJsonValue,
      },
    })

    // Store encrypted access token (Trello tokens don't expire)
    await storeEncryptedToken(
      integration.id,
      token,
      project.organizationId,
      "access"
    )

    // Redirect to the project page
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}?integration=connected`, appUrl)
    )
  } catch (error) {
    console.error("Trello OAuth callback error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    return NextResponse.redirect(new URL("/?error=callback_failed", appUrl))
  }
}
