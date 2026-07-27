"use client"

import { useMemo } from "react"
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { RiskBadge } from "./risk-badge"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { AgentAvatar } from "@/components/agents/agent-avatar"
import { cn } from "@/lib/utils"
import type { ActionProposalDto } from "./approval-card"
import Link from "next/link"

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONF: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    dot: string
  }
> = {
  awaiting_approval: {
    icon: ClockIcon,
    color: "text-amber-400",
    dot: "bg-amber-400 ring-amber-400/30",
  },
  approved: {
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    dot: "bg-emerald-400 ring-emerald-400/30",
  },
  executed: {
    icon: RocketLaunchIcon,
    color: "text-blue-400",
    dot: "bg-blue-400 ring-blue-400/30",
  },
  rejected: {
    icon: XCircleIcon,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground ring-muted-foreground/20",
  },
  failed: {
    icon: WarningIcon,
    color: "text-red-400",
    dot: "bg-red-400 ring-red-400/30",
  },
}

const ACTION_LABELS: Record<string, string> = {
  deploy: "Deploy",
  publish: "Publish",
  delete: "Delete",
  rotate_secret: "Rotate Secret",
  grant_access: "Grant Access",
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function formatSectionDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === yesterday.getTime()) return "Yesterday"
  return date.toLocaleDateString("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function dayKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// ─── Timeline Item ─────────────────────────────────────────────────────────────

function TimelineItem({
  proposal,
  isLast,
}: {
  proposal: ActionProposalDto
  isLast: boolean
}) {
  const conf = STATUS_CONF[proposal.status] ?? STATUS_CONF.awaiting_approval
  const StatusIcon = conf.icon

  return (
    <div className="relative flex gap-4 pl-1">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute top-8 bottom-0 left-[18px] w-px bg-border/40" />
      )}

      {/* Status dot */}
      <div className="relative mt-1 flex shrink-0 flex-col items-center">
        <div className={cn("size-4 rounded-full ring-4", conf.dot)} />
      </div>

      {/* Card */}
      <Link
        href={`/dashboard/proposals/${proposal.id}`}
        className="group mb-4 min-w-0 flex-1 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-muted/30"
      >
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <p className="truncate text-xs leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
            {proposal.title}
          </p>
          <RiskBadge level={proposal.riskLevel} size="xs" />
        </div>

        <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {proposal.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("size-3", conf.color)} />
            <span
              className={cn("text-[10px] font-medium capitalize", conf.color)}
            >
              {proposal.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Action */}
          <span className="text-[10px] text-muted-foreground">
            {ACTION_LABELS[proposal.actionType] ?? proposal.actionType} ·{" "}
            {proposal.targetSystem}
          </span>

          {/* Time */}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatTime(proposal.createdAt)}
          </span>
        </div>
      </Link>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ProposalTimelineProps {
  proposals: ActionProposalDto[]
}

export function ProposalTimeline({ proposals }: ProposalTimelineProps) {
  // Group by day
  const sections = useMemo(() => {
    const map = new Map<string, ActionProposalDto[]>()
    for (const p of proposals) {
      const key = dayKey(p.createdAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    // Each section needs the representative date string for the header
    return Array.from(map.entries()).map(([, items]) => ({
      label: formatSectionDate(items[0].createdAt),
      items,
    }))
  }, [proposals])

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40 py-16 text-center">
        <RocketLaunchIcon className="size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No proposals</p>
        <p className="text-xs text-muted-foreground">
          Proposals will appear here once agents propose actions
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          {/* Date header */}
          <div className="mb-4 flex items-center gap-3 pl-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {section.label}
            </span>
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] text-muted-foreground">
              {section.items.length} action
              {section.items.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Items */}
          <div>
            {section.items.map((proposal, idx) => (
              <TimelineItem
                key={proposal.id}
                proposal={proposal}
                isLast={idx === section.items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
