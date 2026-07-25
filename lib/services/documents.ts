import { prisma } from "@/lib/db"
import { notFound } from "@/lib/api/errors"
import type { AuthContext } from "@/lib/api/auth"
import { writeAuditLog } from "@/lib/services/audit"

export function toDocumentDto(doc: {
  id: string
  projectId: string
  title: string
  content: string | null
  createdById: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: { id: string; name: string; email: string } | null
}) {
  return {
    id: doc.id,
    projectId: doc.projectId,
    title: doc.title,
    content: doc.content,
    createdById: doc.createdById,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    createdBy: doc.createdBy
      ? { id: doc.createdBy.id, name: doc.createdBy.name, email: doc.createdBy.email }
      : null,
  }
}

export type DocumentDto = ReturnType<typeof toDocumentDto>

export async function listDocuments(projectId: string) {
  const documents = await prisma.document.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return documents.map(toDocumentDto)
}

export async function getDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })
  if (!doc) throw notFound("Document not found")
  return toDocumentDto(doc)
}

export async function createDocument(input: {
  ctx: AuthContext
  projectId: string
  title: string
  content?: string
}) {
  const doc = await prisma.document.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      content: input.content ?? null,
      createdById: input.ctx.userId,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "document_create",
    resourceType: "document",
    resourceId: doc.id,
    metadata: { title: doc.title },
  })

  return toDocumentDto(doc)
}

export async function updateDocument(input: {
  ctx: AuthContext
  id: string
  title?: string
  content?: string
}) {
  await getDocument(input.id)

  const doc = await prisma.document.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "document_update",
    resourceType: "document",
    resourceId: doc.id,
    metadata: { title: doc.title },
  })

  return toDocumentDto(doc)
}

export async function deleteDocument(input: {
  ctx: AuthContext
  id: string
}) {
  await getDocument(input.id)
  await prisma.document.delete({ where: { id: input.id } })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "document_delete",
    resourceType: "document",
    resourceId: input.id,
  })
}
