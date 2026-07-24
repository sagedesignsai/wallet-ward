import type { AuditAction, Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import type { AuthContext } from "@/lib/api/auth"

export async function writeAuditLog(input: {
  ctx: Pick<
    AuthContext,
    "userId" | "actorType" | "ipAddress" | "userAgent" | "apiKeyId"
  >
  organizationId: string
  action: AuditAction
  resourceType: string
  resourceId?: string | null
  metadata?: Prisma.InputJsonValue
}) {
  const { ctx, organizationId, action, resourceType, resourceId, metadata } =
    input

  await prisma.auditLog.create({
    data: {
      organizationId,
      actorUserId: ctx.actorType === "user" ? ctx.userId : null,
      actorType: ctx.actorType,
      action,
      resourceType,
      resourceId: resourceId ?? null,
      metadata: {
        ...(metadata && typeof metadata === "object" ? metadata : {}),
        ...(ctx.apiKeyId ? { apiKeyId: ctx.apiKeyId } : {}),
      } as Prisma.InputJsonValue,
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  })
}
