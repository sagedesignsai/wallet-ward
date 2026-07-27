import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { updateOrganizationSchema } from "@/lib/api/validators"
import { prisma } from "@/lib/db"

type Ctx = { params: Promise<{ orgId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx, orgId)

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { members: true, projects: true, auditLogs: true } },
      },
    })

    if (!org) {
      return json(
        { error: { message: "Organization not found" } },
        { status: 404 }
      )
    }

    return json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        metadata: org.metadata,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        memberCount: org._count.members,
        projectCount: org._count.projects,
        auditLogCount: org._count.auditLogs,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx, orgId)
    requirePermission(orgCtx.memberRole, "org:manage")

    const body = updateOrganizationSchema.parse(await request.json())

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.logo !== undefined ? { logo: body.logo } : {}),
      },
    })

    return json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx, orgId)
    requirePermission(orgCtx.memberRole, "org:manage")

    await prisma.organization.delete({ where: { id: orgId } })

    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
