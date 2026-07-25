import { prisma } from "@/lib/db"
import { notFound } from "@/lib/api/errors"
import type { AuthContext } from "@/lib/api/auth"
import { writeAuditLog } from "@/lib/services/audit"
import type { TaskStatus } from "@/generated/prisma/client"

export function toTaskDto(task: {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  assigneeId: string | null
  createdAt: Date
  updatedAt: Date
  assignee?: { id: string; name: string; email: string } | null
}) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeId: task.assigneeId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name, email: task.assignee.email }
      : null,
  }
}

export type TaskDto = ReturnType<typeof toTaskDto>

export async function listTasks(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return tasks.map(toTaskDto)
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })
  if (!task) throw notFound("Task not found")
  return toTaskDto(task)
}

export async function createTask(input: {
  ctx: AuthContext
  projectId: string
  title: string
  description?: string
  assigneeId?: string
}) {
  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      assigneeId: input.assigneeId ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_create",
    resourceType: "task",
    resourceId: task.id,
    metadata: { title: task.title },
  })

  return toTaskDto(task)
}

export async function updateTask(input: {
  ctx: AuthContext
  id: string
  title?: string
  description?: string | null
  status?: TaskStatus
  assigneeId?: string | null
}) {
  await getTask(input.id)

  const task = await prisma.task.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_update",
    resourceType: "task",
    resourceId: task.id,
    metadata: { title: task.title, status: task.status },
  })

  return toTaskDto(task)
}

export async function deleteTask(input: {
  ctx: AuthContext
  id: string
}) {
  await getTask(input.id)
  await prisma.task.delete({ where: { id: input.id } })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_delete",
    resourceType: "task",
    resourceId: input.id,
  })
}
