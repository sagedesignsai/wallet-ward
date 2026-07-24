import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
  forbidden,
  unauthorized,
  type ApiError,
} from "@/lib/api/errors"
import {
  hasPermission,
  type Permission,
} from "@/lib/permissions"

export type AuthContext = {
  userId: string
  userEmail: string
  userName: string
  sessionId?: string
  organizationId: string | null
  memberRole: string | null
  actorType: "user" | "api_key"
  apiKeyId?: string
  ipAddress?: string | null
  userAgent?: string | null
}

function getClientMeta(headerList: Headers) {
  return {
    ipAddress:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip"),
    userAgent: headerList.get("user-agent"),
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const headerList = await headers()
  const meta = getClientMeta(headerList)

  const session = await auth.api.getSession({
    headers: headerList,
  })

  if (session?.user) {
    const organizationId =
      (session.session as { activeOrganizationId?: string | null })
        .activeOrganizationId ?? null

    let memberRole: string | null = null
    if (organizationId) {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: session.user.id,
          },
        },
      })
      memberRole = member?.role ?? null
    }

    return {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      sessionId: session.session.id,
      organizationId,
      memberRole,
      actorType: "user",
      ...meta,
    }
  }

  // Fallback: Better Auth API key header (x-api-key)
  const apiKeyValue =
    headerList.get("x-api-key") ??
    headerList.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null

  if (apiKeyValue) {
    try {
      const verified = await auth.api.verifyApiKey({
        body: { key: apiKeyValue },
      })

      if (verified?.valid && verified.key) {
        const key = verified.key as {
          id: string
          referenceId: string
          metadata?: { organizationId?: string; role?: string } | string | null
        }

        let organizationId: string | null = null
        let memberRole: string | null = "member"

        if (typeof key.metadata === "string") {
          try {
            const parsed = JSON.parse(key.metadata) as {
              organizationId?: string
              role?: string
            }
            organizationId = parsed.organizationId ?? null
            memberRole = parsed.role ?? "member"
          } catch {
            // ignore
          }
        } else if (key.metadata && typeof key.metadata === "object") {
          organizationId = key.metadata.organizationId ?? null
          memberRole = key.metadata.role ?? "member"
        }

        // referenceId may be org id depending on config
        if (!organizationId) {
          organizationId = key.referenceId
        }

        return {
          userId: key.referenceId,
          userEmail: "api-key@wallet-ward.local",
          userName: "API Key",
          organizationId,
          memberRole,
          actorType: "api_key",
          apiKeyId: key.id,
          ...meta,
        }
      }
    } catch {
      // fall through to unauthorized
    }
  }

  throw unauthorized()
}

export async function requireOrganization(
  ctx: AuthContext,
  organizationId?: string
): Promise<AuthContext & { organizationId: string; memberRole: string }> {
  const orgId = organizationId ?? ctx.organizationId
  if (!orgId) {
    throw forbidden("No active organization. Set one or pass organizationId.")
  }

  if (ctx.actorType === "api_key") {
    if (ctx.organizationId !== orgId) {
      throw forbidden("API key is not scoped to this organization")
    }
    return {
      ...ctx,
      organizationId: orgId,
      memberRole: ctx.memberRole ?? "member",
    }
  }

  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: ctx.userId,
      },
    },
  })

  if (!member) {
    throw forbidden("You are not a member of this organization")
  }

  return {
    ...ctx,
    organizationId: orgId,
    memberRole: member.role,
  }
}

export function requirePermission(
  role: string,
  permission: Permission
): void {
  if (!hasPermission(role, permission)) {
    throw forbidden(`Missing permission: ${permission}`)
  }
}

export function assertNever(_x: never): asserts _x is never {
  throw new Error("unreachable")
}

// re-export for convenience
export type { ApiError }
