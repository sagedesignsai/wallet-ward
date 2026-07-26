import { NextResponse } from "next/server"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { prisma } from "@/lib/db"
import { notFound } from "@/lib/api/errors"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const { integrationId } = await params

    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        project: { organizationId: orgCtx.organizationId },
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
      },
    })

    if (!integration) {
      throw notFound("Integration not found")
    }

    // Check health status
    const now = new Date()
    let status: "healthy" | "expiring_soon" | "expired" | "no_token" = "healthy"
    let message = "Integration is healthy"
    let expiresIn: number | null = null

    if (!integration.accessTokenEncrypted) {
      status = "no_token"
      message = "No access token configured"
    } else if (integration.tokenExpiresAt) {
      const expiryTime = new Date(integration.tokenExpiresAt)
      expiresIn = Math.floor((expiryTime.getTime() - now.getTime()) / 1000)

      if (expiresIn <= 0) {
        status = "expired"
        message = "Access token has expired"
      } else if (expiresIn < 300) {
        // Less than 5 minutes
        status = "expiring_soon"
        message = `Access token expires in ${Math.floor(expiresIn / 60)} minutes`
      } else {
        message = `Access token expires in ${Math.floor(expiresIn / 3600)} hours`
      }
    }

    // Check if refresh is available
    const canRefresh = !!integration.refreshTokenEncrypted

    return json({
      status,
      message,
      details: {
        integrationId: integration.id,
        provider: integration.provider,
        enabled: integration.enabled,
        hasAccessToken: !!integration.accessTokenEncrypted,
        hasRefreshToken: !!integration.refreshTokenEncrypted,
        canRefresh,
        tokenExpiresAt: integration.tokenExpiresAt?.toISOString() ?? null,
        expiresInSeconds: expiresIn,
        lastRefreshedAt: integration.lastRefreshedAt?.toISOString() ?? null,
        scopes: integration.scopes,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
