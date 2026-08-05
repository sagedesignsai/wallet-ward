"use client"

import React, { useMemo, useState, useCallback, use } from "react"
import {
  ClockCounterClockwiseIcon,
  FileTextIcon,
  ListChecksIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useAuditLogs, type AuditLog } from "@/hooks/use-audit-logs"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const PROJECT_ACTIONS = [
  "document_create",
  "document_update",
  "document_delete",
  "task_create",
  "task_update",
  "task_delete",
] as const

type ProjectAction = (typeof PROJECT_ACTIONS)[number]

function isProjectAction(action: string): action is ProjectAction {
  return (PROJECT_ACTIONS as readonly string[]).includes(action)
}

function actionIcon(action: string) {
  if (action.startsWith("document_")) return FileTextIcon
  if (action.startsWith("task_")) return ListChecksIcon
  return ClockCounterClockwiseIcon
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    document_create: "created a document",
    document_update: "updated a document",
    document_delete: "deleted a document",
    task_create: "created a task",
    task_update: "updated a task",
    task_delete: "deleted a task",
  }
  return map[action] ?? action.replace(/_/g, " ")
}

export default function ActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ActivityInner projectId={projectId} />
}

function ActivityInner({ projectId }: { projectId: string }) {
  const { project } = useProject(projectId)
  const { logs, isLoading, error } = useAuditLogs()
  const [filter, setFilter] = useState<string>("all")

  if (project) {
    useDashboardConfigStore.setState({
      description: `${project.name} — Project activity`,
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        {
          label: project.name,
          href: `/dashboard/projects/${projectId}`,
        },
        { label: "Activity" },
      ],
    })
  }

  const filtered = useMemo(() => {
    // Filter to only project-related document/task actions
    let result = logs.filter((l) => isProjectAction(l.action))

    if (filter !== "all") {
      result = result.filter((l) => l.action.startsWith(filter))
    }

    return result
  }, [logs, filter])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-border/30 last:border-b-0">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-4 duration-300 fade-in">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-1.5">
        {(["all", "document", "task"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {f === "all" ? "All" : f === "document" ? "Documents" : "Tasks"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockCounterClockwiseIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>
              Activity from documents and tasks will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y divide-border/30 overflow-hidden rounded-lg border border-border/40 bg-card">
          {filtered.map((log) => (
            <ActivityEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityEntry({ log }: { log: AuditLog }) {
  const Icon = actionIcon(log.action)
  const metaTitle =
    log.metadata && typeof log.metadata === "object"
      ? (log.metadata as Record<string, unknown>).title
      : null

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
        <Icon className="size-3" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground">
          <span className="font-medium">{actionLabel(log.action)}</span>
          {typeof metaTitle === "string" && metaTitle.length > 0 && (
            <span className="ml-1 text-muted-foreground">
              &ldquo;{String(metaTitle)}&rdquo;
            </span>
          )}
        </p>
      </div>
      <span className="shrink-0 text-[0.625rem] text-muted-foreground">
        <TimeAgo date={log.createdAt} />
      </span>
    </div>
  )
}
