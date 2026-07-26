"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  WarningIcon,
  SpinnerGapIcon,
  FolderIcon,
  RobotIcon,
} from "@phosphor-icons/react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RiskBadge } from "./risk-badge"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { cn } from "@/lib/utils"
import type { ActionProposalDto } from "./approval-card"
import type { ProposalStatus } from "@/generated/prisma/client"

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  awaiting_approval: {
    label: "Awaiting Approval",
    icon: ClockIcon,
    color: "text-amber-500",
  },
  approved: {
    label: "Approved",
    icon: CheckCircleIcon,
    color: "text-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircleIcon,
    color: "text-red-500",
  },
  executed: {
    label: "Executed",
    icon: RocketLaunchIcon,
    color: "text-blue-500",
  },
  failed: {
    label: "Failed",
    icon: WarningIcon,
    color: "text-red-500",
  },
}

export function ProposalDetail({
  proposal,
  onApprove,
  onReject,
  isActing,
}: {
  proposal: ActionProposalDto
  onApprove?: (notes?: string) => Promise<void>
  onReject?: (notes?: string) => Promise<void>
  isActing?: boolean
}) {
  const [notes, setNotes] = useState("")
  const statusConfig = STATUS_CONFIG[proposal.status]
  const StatusIcon = statusConfig.icon
  const canAct =
    proposal.status === "awaiting_approval" && (onApprove || onReject)

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-border/40">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-lg font-bold text-foreground leading-snug">
                {proposal.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusIcon className={cn("size-3.5", statusConfig.color)} />
                <span className={cn("text-xs font-medium", statusConfig.color)}>
                  {statusConfig.label}
                </span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <TimeAgo
                  date={new Date(proposal.createdAt)}
                  className="text-[11px] text-muted-foreground"
                />
              </div>
            </div>
            <RiskBadge level={proposal.riskLevel} />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Description
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Action", value: proposal.actionType },
              { label: "Target", value: proposal.targetSystem },
              { label: "Risk", value: proposal.riskLevel },
              { label: "Status", value: proposal.status.replace(/_/g, " ") },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/30 bg-muted/20 p-2.5"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-xs font-medium mt-0.5 capitalize truncate">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
              <Link href={`/dashboard/projects/${proposal.projectId}`}>
                <FolderIcon className="size-3.5" />
                Project
              </Link>
            </Button>
            {proposal.agentSessionId && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                <Link href={`/dashboard/agents/${proposal.agentSessionId}`}>
                  <RobotIcon className="size-3.5" />
                  Agent Session
                </Link>
              </Button>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Payload
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed max-h-64">
              {JSON.stringify(proposal.payload ?? {}, null, 2)}
            </pre>
          </div>

          {(proposal.approvalNotes || proposal.rejectionNotes) && (
            <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Notes
              </p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {proposal.approvalNotes || proposal.rejectionNotes}
              </p>
            </div>
          )}

          {proposal.executedAt && (
            <p className="text-xs text-muted-foreground">
              Executed <TimeAgo date={new Date(proposal.executedAt)} />
            </p>
          )}
        </CardContent>

        {canAct && (
          <CardFooter className="flex flex-col gap-3 border-t border-border/30 pt-4">
            <div className="w-full space-y-1.5">
              <Label htmlFor="proposal-notes" className="text-xs">
                Notes (optional)
              </Label>
              <Textarea
                id="proposal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add approval or rejection notes…"
                className="min-h-[72px] text-xs"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              {onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-400 border-red-500/25 hover:bg-red-500/10"
                  disabled={isActing}
                  onClick={() => onReject(notes || undefined)}
                >
                  {isActing ? (
                    <SpinnerGapIcon className="size-3.5 animate-spin" />
                  ) : (
                    <XCircleIcon className="size-3.5" />
                  )}
                  Reject
                </Button>
              )}
              {onApprove && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isActing}
                  onClick={() => onApprove(notes || undefined)}
                >
                  {isActing ? (
                    <SpinnerGapIcon className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="size-3.5" />
                  )}
                  Approve & Execute
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
