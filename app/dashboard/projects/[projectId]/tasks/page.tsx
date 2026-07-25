"use client"

import React, { useEffect, useState, useCallback, useMemo, use } from "react"
import {
  ListChecksIcon,
  PlusIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useTasks, type Task } from "@/hooks/use-tasks"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type StatusConfig = {
  label: string
  color: "secondary" | "outline" | "default"
}

const STATUS_CONFIG: Record<Task["status"], StatusConfig> = {
  todo: { label: "Todo", color: "secondary" },
  in_progress: { label: "In Progress", color: "outline" },
  done: { label: "Done", color: "default" },
}

const STATUS_ORDER: Task["status"][] = ["todo", "in_progress", "done"]

export default function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <TasksInner projectId={projectId} />
}

function TasksInner({ projectId }: { projectId: string }) {
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { tasks, isLoading, error, refetch, createTask, updateTaskStatus } =
    useTasks(projectId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setConfig({
        description: `${project.name} — ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`,
        actions: (
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            New Task
          </Button>
        ),
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          {
            label: project.name,
            href: `/dashboard/projects/${projectId}`,
          },
          { label: "Tasks" },
        ],
      })
    }
  }, [project, tasks.length, setConfig])

  const grouped = useMemo(() => {
    const groups: Record<Task["status"], Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const task of tasks) {
      groups[task.status].push(task)
    }
    return groups
  }, [tasks])

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return
    setSubmitting(true)
    const result = await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
    })
    if (result) {
      setDialogOpen(false)
      setTitle("")
      setDescription("")
    }
    setSubmitting(false)
  }, [title, description, createTask])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {tasks.length === 0 ? (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecksIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No tasks yet</EmptyTitle>
            <EmptyDescription>
              Create your first task to start tracking work on this project.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {STATUS_ORDER.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              onStatusChange={updateTaskStatus}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Describe the task..."
                className="min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!title.trim() || submitting}
            >
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskColumn({
  status,
  tasks,
  onStatusChange,
}: {
  status: Task["status"]
  tasks: Task[]
  onStatusChange: (taskId: string, status: Task["status"]) => Promise<unknown>
}) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Badge variant={cfg.color}>{cfg.label}</Badge>
        <span className="text-[0.625rem] text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/40 bg-card/50 py-6 text-center text-[0.625rem] text-muted-foreground">
          No tasks
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: Task
  onStatusChange: (taskId: string, status: Task["status"]) => Promise<unknown>
}) {
  return (
    <Card className="gap-0 py-3">
      <CardHeader className="px-3 pb-1.5">
        <CardTitle className="text-sm">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground">
            {task.assignee && <span>{task.assignee.name}</span>}
            <span>
              <TimeAgo date={task.updatedAt} />
            </span>
          </div>
          <Select
            value={task.status}
            onValueChange={(val: string) =>
              onStatusChange(task.id, val as Task["status"])
            }
          >
            <SelectTrigger size="sm" className="w-fit text-[0.625rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
