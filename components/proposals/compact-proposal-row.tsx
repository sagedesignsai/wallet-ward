"use client"

import Link from "next/link"
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon,
  WarningIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react"
import { AgentAvatar } from "@/components/agents/agent-avatar"
import { RiskBadge } from "./risk-badge"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { cn } from "@/lib/utils"
import type { ActionProposalDto } from "./approval-card"

const STATUS_ICON: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  awaiting_approval: { icon: ClockIcon, color: "text-amber-400" },
  approved: { icon: CheckCircleIcon, color: "text-emerald-400" },
  rejected: { icon: XCircleIcon, color: "text-muted-foreground" },
  executed: { icon: RocketLaunchIcon, color: "text-blue-400" },
  failed: { icon: WarningIcon, color: "text-red-400" },
}

const ACTION_LABELS: Record<string, string> = {
  deploy: "Deploy",
  publish: "Publish",
  delete: "Delete",
  rotate_secret: "Rotate Secret",
  grant_access: "Grant Access",
}

interface CompactProposalRowProps {
  proposal: ActionProposalDto
  /** If provided, shown as agent type avatar */
  agentType?: string
  showProject?: boolean
  className?: string
}

export function CompactProposalRow({
  proposal,
  agentType,
  showProject = false,
  className,
}: CompactProposalRowProps) {
  const statusConf =
    STATUS_ICON[proposal.status] ?? STATUS_ICON.awaiting_approval
  const StatusIcon = statusConf.icon

  return (
    <Link
      href={`/dashboard/proposals/${proposal.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40",
        className
      )}
    >
      {/* Agent avatar or status icon */}
      {agentType ? (
        <AgentAvatar type={agentType} size="xs" showStatus={false} />
      ) : (
        <StatusIcon className={cn("size-3.5 shrink-0", statusConf.color)} />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-snug font-medium text-foreground">
          {proposal.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {ACTION_LABELS[proposal.actionType] ?? proposal.actionType}
          </span>
          <span className="text-[10px] text-muted-foreground/40">·</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {proposal.targetSystem}
          </span>
          {showProject && (
            <>
              <span className="text-[10px] text-muted-foreground/40">·</span>
              <span className="truncate text-[10px] text-muted-foreground">
                {proposal.projectId.slice(0, 8)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        <RiskBadge level={proposal.riskLevel} size="xs" />
        <span className="text-[10px] text-muted-foreground">
          <TimeAgo date={new Date(proposal.createdAt)} />
        </span>
        <ArrowRightIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}
