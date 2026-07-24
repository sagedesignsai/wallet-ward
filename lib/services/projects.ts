import { prisma } from "@/lib/db"
import { conflict, notFound } from "@/lib/api/errors"
import type { AuthContext } from "@/lib/api/auth"
import { slugify } from "@/lib/slug"
import { writeAuditLog } from "@/lib/services/audit"
import { ensureOrganizationDek } from "@/lib/services/encryption-keys"

const DEFAULT_ENVIRONMENTS = [
  { name: "Development", slug: "development" },
  { name: "Staging", slug: "staging" },
  { name: "Production", slug: "production" },
]

export function toProjectDto(project: {
  id: string
  organizationId: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  environments?: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    createdAt: Date
    updatedAt: Date
  }>
}) {
  return {
    id: project.id,
    organizationId: project.organizationId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    environments: project.environments?.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  }
}

export async function createOrganizationWithVault(input: {
  ctx: AuthContext
  name: string
  slug?: string
}) {
  const slug = input.slug ?? slugify(input.name)
  if (!slug) throw conflict("Could not derive a valid slug")

  // Prefer Better Auth organization API so membership/session stay consistent
  const org = await prisma.$transaction(async (tx) => {
    const existing = await tx.organization.findUnique({ where: { slug } })
    if (existing) throw conflict("Organization slug already taken")

    const created = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: {
            userId: input.ctx.userId,
            role: "owner",
          },
        },
      },
    })
    return created
  })

  await ensureOrganizationDek(org.id)

  // Set active org on session if present
  if (input.ctx.sessionId) {
    await prisma.session.update({
      where: { id: input.ctx.sessionId },
      data: { activeOrganizationId: org.id },
    })
  }

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: org.id,
    action: "organization_create",
    resourceType: "organization",
    resourceId: org.id,
    metadata: { name: org.name, slug: org.slug },
  })

  return org
}

export async function listProjects(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: { environments: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  })
  return projects.map(toProjectDto)
}

export async function createProject(input: {
  ctx: AuthContext
  organizationId: string
  name: string
  slug?: string
  description?: string
}) {
  const slug = input.slug ?? slugify(input.name)
  if (!slug) throw conflict("Could not derive a valid slug")

  const existing = await prisma.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: input.organizationId,
        slug,
      },
    },
  })
  if (existing) throw conflict("Project slug already exists in organization")

  await ensureOrganizationDek(input.organizationId)

  const project = await prisma.project.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      slug,
      description: input.description,
      environments: {
        create: DEFAULT_ENVIRONMENTS,
      },
    },
    include: { environments: true },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "project_create",
    resourceType: "project",
    resourceId: project.id,
    metadata: { name: project.name, slug: project.slug },
  })

  return toProjectDto(project)
}

export async function getProject(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: { environments: { orderBy: { name: "asc" } } },
  })
  if (!project) throw notFound("Project not found")
  return toProjectDto(project)
}

export async function updateProject(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  name?: string
  description?: string | null
}) {
  await getProject(input.projectId, input.organizationId)

  const project = await prisma.project.update({
    where: { id: input.projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
    include: { environments: true },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "project_update",
    resourceType: "project",
    resourceId: project.id,
    metadata: { name: project.name },
  })

  return toProjectDto(project)
}

export async function deleteProject(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
}) {
  await getProject(input.projectId, input.organizationId)
  await prisma.project.delete({ where: { id: input.projectId } })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "project_delete",
    resourceType: "project",
    resourceId: input.projectId,
  })
}

export async function createEnvironment(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  name: string
  slug?: string
  description?: string
}) {
  await getProject(input.projectId, input.organizationId)
  const slug = input.slug ?? slugify(input.name)
  if (!slug) throw conflict("Could not derive a valid slug")

  try {
    const environment = await prisma.environment.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        slug,
        description: input.description,
      },
    })

    await writeAuditLog({
      ctx: input.ctx,
      organizationId: input.organizationId,
      action: "environment_create",
      resourceType: "environment",
      resourceId: environment.id,
      metadata: { name: environment.name, slug: environment.slug },
    })

    return {
      id: environment.id,
      name: environment.name,
      slug: environment.slug,
      description: environment.description,
      createdAt: environment.createdAt.toISOString(),
      updatedAt: environment.updatedAt.toISOString(),
    }
  } catch {
    throw conflict("Environment slug already exists in project")
  }
}
