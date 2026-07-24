import { requireAuth } from "@/lib/api/auth"
import { forbidden } from "@/lib/api/errors"
import { handleRouteError, json } from "@/lib/api/http"
import { createOrganizationSchema } from "@/lib/api/validators"
import { prisma } from "@/lib/db"
import { createOrganizationWithVault } from "@/lib/services/projects"

export async function GET() {
  try {
    const ctx = await requireAuth()
    if (ctx.actorType === "api_key") {
      const org = ctx.organizationId
        ? await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
          })
        : null
      return json({ data: org ? [org] : [] })
    }

    const memberships = await prisma.member.findMany({
      where: { userId: ctx.userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    })

    return json({
      data: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logo: m.organization.logo,
        role: m.role,
        createdAt: m.organization.createdAt.toISOString(),
      })),
      activeOrganizationId: ctx.organizationId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth()
    if (ctx.actorType === "api_key") {
      throw forbidden("API keys cannot create organizations")
    }

    const body = createOrganizationSchema.parse(await request.json())
    const org = await createOrganizationWithVault({
      ctx,
      name: body.name,
      slug: body.slug,
    })

    return json(
      {
        data: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
