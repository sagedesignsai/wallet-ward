"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon,
  WarningIcon,
  ArrowsCounterClockwiseIcon,
  SpinnerGapIcon,
  ListIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useProposals } from "@/hooks/use-proposals"
import { ApprovalCard } from "@/components/proposals/approval-card"
import { ProposalTimeline } from "@/components/proposals/proposal-timeline"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ActionProposalDto } from "@/components/proposals/approval-card"

type ViewMode = "list" | "timeline"

const STATUS_GROUPS = [
  {
    key: "awaiting_approval" as const,
    label: "Awaiting Approval",
    icon: ClockIcon,
    color: "text-amber-400",
    emptyLabel: "No actions awaiting approval",
    defaultExpanded: true,
  },
  {
    key: "executed" as const,
    label: "Executed",
    icon: RocketLaunchIcon,
    color: "text-blue-400",
    emptyLabel: null,
    defaultExpanded: true,
  },
  {
    key: "failed" as const,
    label: "Failed",
    icon: WarningIcon,
    color: "text-red-400",
    emptyLabel: null,
    defaultExpanded: true,
  },
  {
    key: "rejected" as const,
    label: "Rejected",
    icon: XCircleIcon,
    color: "text-muted-foreground",
    emptyLabel: null,
    defaultExpanded: false,
  },
  {
    key: "approved" as const,
    label: "Approved",
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    emptyLabel: null,
    defaultExpanded: false,
  },
]

function ProposalGroup({
  group,
  proposals,
  highlightId,
  onApprove,
  onReject,
}: {
  group: (typeof STATUS_GROUPS)[number]
  proposals: ActionProposalDto[]
  highlightId?: string | null
  onApprove: (id: string, notes?: string) => Promise<void>
  onReject: (id: string, notes?: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(group.defaultExpanded)
  const Icon = group.icon

  if (proposals.length === 0) {
    if (!group.emptyLabel) return null
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/40 px-4 py-3 text-xs text-muted-foreground">
        <Icon className={cn("size-3.5 shrink-0", group.color)} />
        {group.emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <Icon className={cn("size-3.5 shrink-0", group.color)} />
        <span className="text-xs font-semibold text-foreground">
          {group.label}
        </span>
        <Badge
          variant="outline"
          className="ml-1 h-4 px-1.5 text-[9px] font-bold"
        >
          {proposals.length}
        </Badge>
        <div className="ml-2 h-px flex-1 bg-border/40" />
        <span className="ml-2 text-[10px] text-muted-foreground">
          {expanded ? "hide" : "show"}
        </span>
      </button>
      {expanded && (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ApprovalCard
              key={proposal.id}
              proposal={proposal}
              highlighted={highlightId === proposal.id}
              onApprove={
                proposal.status === "awaiting_approval" ? onApprove : undefined
              }
              onReject={
                proposal.status === "awaiting_approval" ? onReject : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectProposalsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ProjectProposalsInner projectId={projectId} />
}

function ProjectProposalsInner({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams()
  const { project } = useProject(projectId)
  const initialStatus = searchParams.get("status") ?? "all"
  const highlightId = searchParams.get("highlight")

  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const {
    proposals,
    isLoading,
    isRefreshing,
    lastFetchedAt,
    fetchProposals,
    approveProposal,
    rejectProposal,
  } = useProposals({
    projectId,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    polling: true,
    orgWide: false,
  })

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`proposal-${highlightId}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlightId, proposals])

  if (project) {
    useDashboardConfigStore.setState({
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        { label: "Proposals" },
      ],
    })
  }

  const pending = useMemo(
    () => proposals.filter((p) => p.status === "awaiting_approval"),
    [proposals]
  )
  const executed = useMemo(
    () => proposals.filter((p) => p.status === "executed"),
    [proposals]
  )
  const rejected = useMemo(
    () => proposals.filter((p) => p.status === "rejected"),
    [proposals]
  )
  const failed = useMemo(
    () => proposals.filter((p) => p.status === "failed"),
    [proposals]
  )
  const approved = useMemo(
    () => proposals.filter((p) => p.status === "approved"),
    [proposals]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Statuses
            </SelectItem>
            <SelectItem value="awaiting_approval" className="text-xs">
              Awaiting Approval
            </SelectItem>
            <SelectItem value="executed" className="text-xs">
              Executed
            </SelectItem>
            <SelectItem value="approved" className="text-xs">
              Approved
            </SelectItem>
            <SelectItem value="rejected" className="text-xs">
              Rejected
            </SelectItem>
            <SelectItem value="failed" className="text-xs">
              Failed
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs sm:ml-auto"
          onClick={() => fetchProposals()}
          disabled={isLoading}
        >
          {isRefreshing ? (
            <SpinnerGapIcon className="size-3.5 animate-spin" />
          ) : (
            <ArrowsCounterClockwiseIcon className="size-3.5" />
          )}
          Refresh
          {lastFetchedAt && (
            <span className="hidden text-muted-foreground sm:inline">
              · <TimeAgo date={lastFetchedAt} />
            </span>
          )}
        </Button>

        <div className="flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/20 p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <ListIcon className="size-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium",
              viewMode === "timeline"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <ClockCounterClockwiseIcon className="size-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40 py-16 text-center">
          <CheckCircleIcon className="size-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No proposals found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Org-wide view:{" "}
              <Link
                href="/dashboard/proposals"
                className="text-primary hover:underline"
              >
                all proposals
              </Link>
            </p>
          </div>
        </div>
      ) : viewMode === "timeline" ? (
        <ProposalTimeline proposals={proposals} />
      ) : statusFilter === "all" ? (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const map: Record<string, ActionProposalDto[]> = {
              awaiting_approval: pending,
              executed,
              failed,
              rejected,
              approved,
            }
            return (
              <ProposalGroup
                key={group.key}
                group={group}
                proposals={map[group.key] ?? []}
                highlightId={highlightId}
                onApprove={approveProposal}
                onReject={rejectProposal}
              />
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ApprovalCard
              key={proposal.id}
              proposal={proposal}
              highlighted={highlightId === proposal.id}
              onApprove={
                proposal.status === "awaiting_approval"
                  ? approveProposal
                  : undefined
              }
              onReject={
                proposal.status === "awaiting_approval"
                  ? rejectProposal
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
