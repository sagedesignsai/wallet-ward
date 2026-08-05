"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  ClipboardTextIcon as EmptyIcon,
  ArrowClockwiseIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import {
  useAuditLogs,
  type AuditLog,
  type AuditAction,
} from "@/hooks/use-audit-logs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

import { AuditStats } from "@/components/audit-log/audit-stats"
import { LogEntry, LogEntrySkeleton } from "@/components/audit-log/log-entry"
import {
  LogFilters,
  type ActionCategory,
  type ActorFilter,
} from "@/components/audit-log/log-filters"

// ---------------------------------------------------------------------------
// Filtering helpers
// ---------------------------------------------------------------------------

const CATEGORY_ACTIONS: Record<ActionCategory, AuditAction[]> = {
  all: [],
  projects: ["project_create", "project_update", "project_delete"],
  environments: [
    "environment_create",
    "environment_update",
    "environment_delete",
  ],
  secrets: [
    "secret_create",
    "secret_update",
    "secret_delete",
    "secret_reveal",
    "secret_export",
    "secret_import",
    "secret_version_create",
  ],
  proposals: [
    "proposal_create",
    "proposal_approve",
    "proposal_reject",
    "proposal_execute",
    "agent_proxy_call",
  ],
  organization: ["organization_create"],
}

// ---------------------------------------------------------------------------
// Date grouping
// ---------------------------------------------------------------------------

type DateGroup = {
  label: string
  dateKey: string
  logs: AuditLog[]
}

function toDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getDateGroupLabel(dateKey: string): string {
  const now = new Date()
  const todayKey = toDateKey(now.toISOString())

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday.toISOString())

  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  const groupDate = new Date(dateKey + "T00:00:00")

  if (dateKey === todayKey) return "Today"
  if (dateKey === yesterdayKey) return "Yesterday"
  if (groupDate >= weekAgo) return "This Week"
  return "Earlier"
}

function groupByDate(logs: AuditLog[]): DateGroup[] {
  const map = new Map<string, AuditLog[]>()

  for (const log of logs) {
    const key = toDateKey(log.createdAt)
    const existing = map.get(key)
    if (existing) {
      existing.push(log)
    } else {
      map.set(key, [log])
    }
  }

  // Sort keys descending (newest first)
  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

  return sortedKeys.map((key) => ({
    label: getDateGroupLabel(key),
    dateKey: key,
    logs: map.get(key)!,
  }))
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuditLogsPage() {
  const { setConfig } = useDashboardConfig()
  const { logs, isLoading, isLoadingMore, hasMore, error, loadMore, refetch } =
    useAuditLogs()

  // Filter state
  const [category, setCategory] = useState<ActionCategory>("all")
  const [actorType, setActorType] = useState<ActorFilter>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    setConfig({
      description: "Track all activity across your organization",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Audit Log" },
      ],
    })
  }, [setConfig])

  // Filtered logs
  const filtered = useMemo(() => {
    let result = logs

    // Category filter
    if (category !== "all") {
      const allowed = CATEGORY_ACTIONS[category]
      result = result.filter((l) => allowed.includes(l.action))
    }

    // Actor type filter
    if (actorType !== "all") {
      result = result.filter((l) => l.actorType === actorType)
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((l) => {
        // Search across action name, resource type, and metadata values
        const metaStr = l.metadata
          ? JSON.stringify(l.metadata).toLowerCase()
          : ""
        return (
          l.action.toLowerCase().includes(q) ||
          l.resourceType.toLowerCase().includes(q) ||
          (l.ipAddress ?? "").toLowerCase().includes(q) ||
          metaStr.includes(q)
        )
      })
    }

    return result
  }, [logs, category, actorType, search])

  // Grouped logs
  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (category !== "all") count++
    if (actorType !== "all") count++
    if (search.trim()) count++
    return count
  }, [category, actorType, search])

  const clearFilters = useCallback(() => {
    setCategory("all")
    setActorType("all")
    setSearch("")
  }, [])

  return (
    <div className="flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={refetch}
            className="shrink-0 font-medium underline underline-offset-2 transition-colors hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <AuditStats logs={logs} isLoading={isLoading} />

      <Separator className="opacity-40" />

      {/* Filters */}
      <LogFilters
        category={category}
        onCategoryChange={setCategory}
        actorType={actorType}
        onActorTypeChange={setActorType}
        search={search}
        onSearchChange={setSearch}
        activeCount={activeFilterCount}
        onClearAll={clearFilters}
      />

      {/* Timeline */}
      <div className="flex flex-col">
        {isLoading ? (
          /* Loading skeleton */
          <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-border/30 last:border-b-0"
              >
                <LogEntrySkeleton />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <Empty className="rounded-lg border border-border/40 bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <EmptyIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>
                {logs.length === 0
                  ? "No audit events yet"
                  : "No matching events"}
              </EmptyTitle>
              <EmptyDescription>
                {logs.length === 0
                  ? "Activity will appear here as your team uses Flowspace."
                  : "Try adjusting your filters or search to find what you're looking for."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          /* Grouped timeline */
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.dateKey} className="flex flex-col gap-1">
                {/* Date group header */}
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[0.625rem] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    {group.label}
                  </span>
                  <span className="font-mono text-[0.625rem] text-muted-foreground/50">
                    {new Date(group.dateKey + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                  <div className="h-px flex-1 bg-border/30" />
                  <span className="text-[0.625rem] text-muted-foreground/50 tabular-nums">
                    {group.logs.length} event
                    {group.logs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Entries */}
                <div className="divide-y divide-border/30 overflow-hidden rounded-lg border border-border/40 bg-card">
                  {group.logs.map((log, i) => (
                    <LogEntry
                      key={log.id}
                      log={log}
                      isFirst={i === 0}
                      isLast={i === group.logs.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="gap-1.5"
                >
                  {isLoadingMore ? (
                    <>
                      <ArrowClockwiseIcon className="size-3 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            {/* End marker */}
            {!hasMore && filtered.length > 0 && (
              <div className="flex justify-center py-4">
                <span className="text-[0.625rem] text-muted-foreground/50">
                  All events loaded · {filtered.length} total
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
