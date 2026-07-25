"use client"

import { useMemo } from "react"
import Link from "next/link"
import { FileTextIcon, ListChecksIcon } from "@phosphor-icons/react"

import { useGlobalDocuments, type GlobalDocument } from "@/hooks/use-global-documents"
import { useGlobalTasks, type GlobalTask } from "@/hooks/use-global-tasks"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function RecentDocumentsCard({
  documents,
  isLoading,
}: {
  documents: GlobalDocument[]
  isLoading: boolean
}) {
  const recent = useMemo(() => documents.slice(0, 3), [documents])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Documents</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/documents">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-border/30 px-3 py-2">
                <div className="size-6 animate-pulse rounded bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <FileTextIcon className="size-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              No documents yet. Create one in a project to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/30">
            {recent.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileTextIcon className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{doc.title}</p>
                  <p className="text-[0.625rem] text-muted-foreground">{doc.project.name}</p>
                </div>
                <TimeAgo date={doc.updatedAt} className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MyTasksCard({
  tasks,
  isLoading,
  userId,
}: {
  tasks: GlobalTask[]
  isLoading: boolean
  userId?: string
}) {
  const myTasks = useMemo(
    () =>
      tasks
        .filter((t) => !userId || !t.assigneeId || t.assigneeId === userId)
        .slice(0, 5),
    [tasks, userId]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Tasks</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tasks">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-border/30 px-3 py-2">
                <div className="size-6 animate-pulse rounded bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : myTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <ListChecksIcon className="size-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              No tasks yet. Create one in a project to start tracking work.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/30">
            {myTasks.map((task) => {
              const statusVariant =
                task.status === "done" ? "default" : task.status === "in_progress" ? "outline" : "secondary"
              const statusLabel =
                task.status === "in_progress" ? "In Progress" : task.status === "done" ? "Done" : "Todo"
              return (
                <div key={task.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ListChecksIcon className="size-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                    <p className="text-[0.625rem] text-muted-foreground">{task.project.name}</p>
                  </div>
                  <Badge variant={statusVariant} className="shrink-0">{statusLabel}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
