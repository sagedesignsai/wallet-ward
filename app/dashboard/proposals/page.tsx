"use client"

import { useEffect, useState, useMemo } from "react"
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

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjects } from "@/hooks/use-projects"
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
        <span className="text-xs font-semibold text-foreground">{group.label}</span>
        <Badge
          variant="outline"
          className={cn(
            "h-4 px-1.5 text-[9px] font-bold ml-1",
            group.key === "awaiting_approval" &&
              "bg-amber-500/15 text-amber-400 border-amber-500/25"
          )}
        >
          {proposals.length}
        </Badge>
        <div className="flex-1 h-px bg-border/40 ml-2" />
        <span className="text-[10px] text-muted-foreground ml-2">
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

function StatPill({
  icon: Icon,
  label,
  count,
  color,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
        active
          ? "border-primary/40 bg-primary/8 shadow-sm"
          : "border-border/40 bg-muted/20 hover:bg-muted/40"
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", color)} />
      <div>
        <p className="text-sm font-bold text-foreground leading-none">{count}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </button>
  )
}

export default function ProposalsPage() {
  const { setConfig } = useDashboardConfig()
  const searchParams = useSearchParams()
  const { projects, isLoading: isProjectsLoading } = useProjects()

  const initialProjectId = searchParams.get("projectId") ?? "all"
  const initialStatus = searchParams.get("status") ?? "all"
  const highlightId = searchParams.get("highlight")

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const projectIdFilter =
    selectedProjectId === "all" ? undefined : selectedProjectId

  const {
    proposals,
    isLoading,
    isRefreshing,
    lastFetchedAt,
    fetchProposals,
    approveProposal,
    rejectProposal,
  } = useProposals({
    projectId: projectIdFilter,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    polling: true,
    orgWide: true,
  })

  useEffect(() => {
    if (highlightId) {
      const t = setTimeout(() => {
        const el = document.getElementById(`proposal-${highlightId}`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
      return () => clearTimeout(t)
    }
  }, [highlightId, proposals])

  useEffect(() => {
    setConfig({
      title: "Proposals",
      description: "Review and approve agent-proposed actions",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Proposals" },
      ],
    })
  }, [setConfig])

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

  const grouped = useMemo(
    () => ({ pending, executed, failed, rejected, approved }),
    [pending, executed, failed, rejected, approved]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={selectedProjectId}
          onValueChange={setSelectedProjectId}
          disabled={isProjectsLoading}
        >
          <SelectTrigger className="h-8 text-xs sm:w-56">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All projects
            </SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          className="h-8 text-xs gap-1.5 sm:ml-auto"
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
            <span className="text-muted-foreground hidden sm:inline">
              · <TimeAgo date={lastFetchedAt} />
            </span>
          )}
        </Button>

        <div className="flex items-center rounded-md border border-border/40 bg-muted/20 p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListIcon className="size-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              viewMode === "timeline"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClockCounterClockwiseIcon className="size-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {!isLoading && proposals.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill
            icon={ClockIcon}
            label="Pending"
            count={pending.length}
            color="text-amber-400"
            active={statusFilter === "awaiting_approval"}
            onClick={() =>
              setStatusFilter((s) =>
                s === "awaiting_approval" ? "all" : "awaiting_approval"
              )
            }
          />
          <StatPill
            icon={RocketLaunchIcon}
            label="Executed"
            count={executed.length}
            color="text-blue-400"
            active={statusFilter === "executed"}
            onClick={() =>
              setStatusFilter((s) => (s === "executed" ? "all" : "executed"))
            }
          />
          <StatPill
            icon={XCircleIcon}
            label="Rejected"
            count={rejected.length}
            color="text-muted-foreground"
            active={statusFilter === "rejected"}
            onClick={() =>
              setStatusFilter((s) => (s === "rejected" ? "all" : "rejected"))
            }
          />
          <StatPill
            icon={WarningIcon}
            label="Failed"
            count={failed.length}
            color="text-red-400"
            active={statusFilter === "failed"}
            onClick={() =>
              setStatusFilter((s) => (s === "failed" ? "all" : "failed"))
            }
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 py-16 gap-3 text-center">
          <CheckCircleIcon className="size-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">No proposals found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === "all"
                ? "No action proposals yet across your organization"
                : `No ${statusFilter.replace(/_/g, " ")} proposals`}
            </p>
          </div>
        </div>
      ) : viewMode === "timeline" ? (
        <ProposalTimeline proposals={proposals} />
      ) : statusFilter === "all" ? (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const map: Record<string, ActionProposalDto[]> = {
              awaiting_approval: grouped.pending,
              executed: grouped.executed,
              failed: grouped.failed,
              rejected: grouped.rejected,
              approved: grouped.approved,
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
