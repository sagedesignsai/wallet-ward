"use client"

import { useMemo } from "react"
import Link from "next/link"
import { FolderIcon } from "@phosphor-icons/react"

import {
  useGlobalTasks,
  type GlobalTask,
} from "@/hooks/use-global-tasks"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WarningCircleIcon, ListChecksIcon, FolderOpenIcon } from "@phosphor-icons/react"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"

type StatusConfig = {
  label: string
  color: "secondary" | "outline" | "default"
}

const STATUS_CONFIG: Record<GlobalTask["status"], StatusConfig> = {
  todo: { label: "Todo", color: "secondary" },
  in_progress: { label: "In Progress", color: "outline" },
  done: { label: "Done", color: "default" },
}

const STATUS_ORDER: GlobalTask["status"][] = ["todo", "in_progress", "done"]

export function TaskFilters({
  filters,
  activeFilterCount,
  projects,
  setFilter,
  clearFilters,
}: {
  filters: { projectId: string | null; status: string | null; search: string }
  activeFilterCount: number
  projects: { id: string; name: string; slug: string }[]
  setFilter: (key: "projectId" | "status" | "search", value: string | null) => void
  clearFilters: () => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        placeholder="Search tasks..."
        value={filters.search}
        onChange={(e) => setFilter("search", e.target.value)}
        className="max-w-xs h-8 text-xs"
      />
      <Select
        value={filters.projectId ?? "__all__"}
        onValueChange={(val: string) =>
          setFilter("projectId", val === "__all__" ? null : val)
        }
      >
        <SelectTrigger size="sm" className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="All projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? "__all__"}
        onValueChange={(val: string) =>
          setFilter("status", val === "__all__" ? null : val)
        }
      >
        <SelectTrigger size="sm" className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

export function TaskKanban({
  tasks,
}: {
  tasks: GlobalTask[]
}) {
  const grouped = useMemo(() => {
    const groups: Record<GlobalTask["status"], GlobalTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const task of tasks) {
      groups[task.status].push(task)
    }
    return groups
  }, [tasks])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATUS_ORDER.map((status) => (
        <TaskColumn key={status} status={status} tasks={grouped[status]} />
      ))}
    </div>
  )
}

function TaskColumn({
  status,
  tasks,
}: {
  status: GlobalTask["status"]
  tasks: GlobalTask[]
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
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: GlobalTask }) {
  return (
    <Card className="gap-0 py-3 hover:border-border/60 transition-colors">
      <CardHeader className="px-3 pb-1.5">
        <CardTitle className="text-sm">
          <Link
            href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
            className="hover:text-primary transition-colors"
          >
            {task.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground">
            <Link
              href={`/dashboard/projects/${task.projectId}`}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderIcon className="size-2.5 shrink-0" />
              <span className="truncate">{task.project.name}</span>
            </Link>
            {task.assignee && (
              <span className="truncate">{task.assignee.name}</span>
            )}
          </div>
          <TimeAgo date={task.updatedAt} className="shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskEmptyState() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex flex-col items-center gap-4 py-12 px-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10 transition-transform hover:scale-105">
          <FolderOpenIcon className="size-7" weight="light" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            No tasks yet
          </h3>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Create your first task within a project to start tracking work.
          </p>
        </div>
        <Button size="default" className="shadow-md shadow-primary/10" asChild>
          <Link href="/dashboard/projects">
            <FolderIcon />
            Go to Projects
          </Link>
        </Button>
      </div>
    </div>
  )
}
