import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { prisma } from "@/lib/db"

type Ctx = { params: Promise<{ orgId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx, orgId)
    requirePermission(orgCtx.memberRole, "secret:read")

    const [encryptionKey, totalSecrets, encryptedSecretVersions] =
      await Promise.all([
        prisma.organizationEncryptionKey.findUnique({
          where: { organizationId: orgId },
          select: {
            algorithm: true,
            keyVersion: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.secret.count({
          where: { project: { organizationId: orgId } },
        }),
        prisma.secretVersion.count({
          where: { secret: { project: { organizationId: orgId } } },
        }),
      ])

    return json({
      data: {
        algorithm: encryptionKey?.algorithm ?? null,
        keyVersion: encryptionKey?.keyVersion ?? null,
        lastKeyRotation: encryptionKey?.createdAt.toISOString() ?? null,
        totalSecrets,
        encryptedSecrets: encryptedSecretVersions,
        hasEncryptionKey: !!encryptionKey,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
