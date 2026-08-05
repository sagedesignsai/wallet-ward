"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { WarningIcon, ListChecksIcon, TrashIcon } from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useTask, type Task } from "@/hooks/use-tasks"
import { OpenInComputer } from "@/components/workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = use(params)
  return <TaskDetailInner projectId={projectId} taskId={taskId} />
}

function TaskDetailInner({
  projectId,
  taskId,
}: {
  projectId: string
  taskId: string
}) {
  const router = useRouter()
  const { project } = useProject(projectId)
  const { task, isLoading, isSaving, error, save, remove } = useTask(
    projectId,
    taskId
  )

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<Task["status"]>("todo")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setDirty(false)
    }
  }, [task])

  if (project && task) {
    useDashboardConfigStore.setState({
      title: task.title,
      description: "Edit task",
      actions: (
        <div className="flex gap-2">
          <OpenInComputer
            showLabel
            label="Open in Computer"
            size="sm"
            variant="outline"
            tab={{
              type: "task",
              title: task.title,
              content: {
                type: "task",
                title: task.title,
                description: task.description ?? undefined,
                status: task.status,
                resourceId: task.id,
                projectId: task.projectId,
              },
            }}
          />
        </div>
      ),
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        { label: "Tasks", href: `/dashboard/projects/${projectId}/tasks` },
        { label: task.title },
      ],
    })
  }

  const handleSave = async () => {
    const updated = await save({
      title: title.trim(),
      description: description.trim() || null,
      status,
    })
    if (updated) {
      setDirty(false)
      toast.success("Task saved")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return
    const ok = await remove()
    if (ok) {
      toast.success("Task deleted")
      router.push(`/dashboard/projects/${projectId}/tasks`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <ListChecksIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>Task not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This task may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href={`/dashboard/projects/${projectId}/tasks`}>
            Back to Tasks
          </Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-status">Status</Label>
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v as Task["status"])
            setDirty(true)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          className="min-h-[160px]"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!dirty || !title.trim() || isSaving}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="ghost"
          className="gap-1.5 text-red-400 hover:text-red-300"
          onClick={handleDelete}
        >
          <TrashIcon className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}
