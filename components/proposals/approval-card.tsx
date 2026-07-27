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
  ArrowSquareOutIcon,
  CaretDownIcon,
  CodeIcon,
  PencilSimpleIcon,
  GearIcon,
  MagnifyingGlassIcon,
  ArrowCounterClockwiseIcon,
  CopyIcon,
  type IconWeight,
} from "@phosphor-icons/react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RiskBadge } from "./risk-badge"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type {
  ProposalStatus,
  ProposalRiskLevel,
} from "@prisma/client"

// ─── DTO ──────────────────────────────────────────────────────────────────────

export type ActionProposalDto = {
  id: string
  projectId: string
  agentSessionId: string | null
  title: string
  description: string
  riskLevel: ProposalRiskLevel
  actionType: string
  targetSystem: string
  status: ProposalStatus
  payload: Record<string, unknown>
  metadata?: Record<string, unknown> | null
  approvedById: string | null
  approvalNotes: string | null
  rejectionNotes: string | null
  executedAt: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string
    icon: React.ComponentType<{ className?: string; weight?: IconWeight }>
    color: string
    bg: string
  }
> = {
  awaiting_approval: {
    label: "Awaiting Approval",
    icon: ClockIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/8 border-amber-500/20",
  },
  approved: {
    label: "Approved",
    icon: CheckCircleIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/8 border-emerald-500/20",
  },
  rejected: {
    label: "Rejected",
    icon: XCircleIcon,
    color: "text-red-500",
    bg: "bg-red-500/8 border-red-500/20",
  },
  executed: {
    label: "Executed",
    icon: RocketLaunchIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/8 border-blue-500/20",
  },
  failed: {
    label: "Failed",
    icon: WarningIcon,
    color: "text-red-500",
    bg: "bg-red-500/8 border-red-500/20",
  },
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  deploy: "Deploy",
  publish: "Publish",
  delete: "Delete",
  rotate_secret: "Rotate Secret",
  grant_access: "Grant Access",
}

const AGENT_TYPE_CONFIG: Record<
  string,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bg: string
  }
> = {
  coding: {
    label: "Coding Agent",
    icon: CodeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  content: {
    label: "Content Agent",
    icon: PencilSimpleIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  ops: {
    label: "Ops Agent",
    icon: GearIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  research: {
    label: "Research Agent",
    icon: MagnifyingGlassIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PayloadPreview({ payload }: { payload: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  const text = JSON.stringify(payload, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    toast.success("Payload copied")
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <CaretDownIcon
            className={cn("size-3 transition-transform", open && "rotate-180")}
          />
          View payload
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="relative mt-2 rounded-lg border border-border/50 bg-muted/40">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            <CopyIcon className="size-3" />
          </Button>
          <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-muted-foreground">
            {text}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ExecutionResultSection({
  metadata,
  executedAt,
}: {
  metadata: Record<string, unknown> | null | undefined
  executedAt: string | null
}) {
  const execution = metadata?.execution as Record<string, unknown> | undefined
  const deploymentUrl = execution?.deploymentUrl as string | undefined
  const commitSha = execution?.commitSha as string | undefined
  const message = execution?.message as string | undefined
  const logs = execution?.logs as string | undefined
  const [logsOpen, setLogsOpen] = useState(false)

  return (
    <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
      <div className="flex items-center gap-2">
        <RocketLaunchIcon className="size-3.5 shrink-0 text-blue-400" />
        <span className="text-xs font-semibold text-blue-400">
          Executed Successfully
        </span>
        {executedAt && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            <TimeAgo date={new Date(executedAt)} />
          </span>
        )}
      </div>

      {message && <p className="text-xs text-muted-foreground">{message}</p>}

      {(deploymentUrl || commitSha) && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {deploymentUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              asChild
            >
              <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOutIcon className="size-3" />
                View Deployment
              </a>
            </Button>
          )}
          {commitSha && (
            <span className="flex items-center gap-1 rounded bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
              <CodeIcon className="size-3" />
              {(commitSha as string).slice(0, 7)}
            </span>
          )}
        </div>
      )}

      {logs && (
        <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
              <CaretDownIcon
                className={cn(
                  "size-3 transition-transform",
                  logsOpen && "rotate-180"
                )}
              />
              Execution logs
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 overflow-x-auto rounded border border-border/40 bg-muted/40 p-3 text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {logs}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

function ExecutionFailureSection({
  metadata,
  onRetry,
}: {
  metadata: Record<string, unknown> | null | undefined
  onRetry?: () => void
}) {
  const execution = metadata?.execution as Record<string, unknown> | undefined
  const errorMsg = (execution?.error ?? execution?.message) as
    string | undefined

  return (
    <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <div className="flex items-center gap-2">
        <WarningIcon className="size-3.5 shrink-0 text-red-400" weight="fill" />
        <span className="text-xs font-semibold text-red-400">
          Execution Failed
        </span>
      </div>
      {errorMsg && (
        <p className="rounded border border-red-500/15 bg-red-500/10 px-2.5 py-1.5 font-mono text-[11px] break-all text-red-300/80">
          {errorMsg}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-red-500/20 text-xs text-red-400 hover:bg-red-500/10"
          onClick={onRetry}
        >
          <ArrowCounterClockwiseIcon className="size-3" />
          Retry
        </Button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ApprovalCardProps = {
  proposal: ActionProposalDto
  onApprove?: (proposalId: string, notes?: string) => Promise<void>
  onReject?: (proposalId: string, notes?: string) => Promise<void>
  className?: string
  highlighted?: boolean
}

export function ApprovalCard({
  proposal,
  onApprove,
  onReject,
  className,
  highlighted,
}: ApprovalCardProps) {
  const [notes, setNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const statusConfig = STATUS_CONFIG[proposal.status]
  const StatusIcon = statusConfig.icon
  const canAct =
    proposal.status === "awaiting_approval" && (onApprove || onReject)
  const isAwaitingApproval = proposal.status === "awaiting_approval"

  const handleApprove = async () => {
    if (!onApprove) return
    setIsApproving(true)
    try {
      await onApprove(proposal.id, notes || undefined)
    } finally {
      setIsApproving(false)
      setNotes("")
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setIsRejecting(true)
    try {
      await onReject(proposal.id, notes || undefined)
    } finally {
      setIsRejecting(false)
      setNotes("")
    }
  }

  return (
    <Card
      id={`proposal-${proposal.id}`}
      className={cn(
        "overflow-hidden transition-shadow",
        isAwaitingApproval &&
          "border-amber-500/25 shadow-sm shadow-amber-500/5",
        highlighted && "border-primary/40 ring-2 ring-primary/50",
        className
      )}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <CardHeader className="space-y-2.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm leading-snug font-semibold text-foreground">
              <Link
                href={`/dashboard/proposals/${proposal.id}`}
                className="transition-colors hover:text-primary"
              >
                {proposal.title}
              </Link>
            </h3>
            {proposal.agentSessionId && (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                session:{" "}
                <Link
                  href={`/dashboard/agents/${proposal.agentSessionId}`}
                  className="underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {proposal.agentSessionId.slice(0, 12)}…
                </Link>
              </p>
            )}
          </div>
          <RiskBadge level={proposal.riskLevel} />
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("size-3.5 shrink-0", statusConfig.color)} />
          <span className={cn("text-xs font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <TimeAgo
            date={new Date(proposal.createdAt)}
            className="text-[11px] text-muted-foreground"
          />
        </div>
      </CardHeader>

      {/* ── Body ───────────────────────────────────────────────── */}
      <CardContent className="space-y-4 pt-0">
        {/* Description */}
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {proposal.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/40 bg-muted/30 p-3">
          <div>
            <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Action
            </dt>
            <dd className="mt-0.5 text-xs font-semibold">
              {ACTION_TYPE_LABELS[proposal.actionType] ?? proposal.actionType}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Target
            </dt>
            <dd className="mt-0.5 truncate text-xs font-semibold">
              {proposal.targetSystem}
            </dd>
          </div>
        </div>

        {/* Payload Preview */}
        <PayloadPreview payload={proposal.payload} />

        {/* Execution Result */}
        {proposal.status === "executed" && (
          <ExecutionResultSection
            metadata={proposal.metadata}
            executedAt={proposal.executedAt}
          />
        )}

        {/* Failure */}
        {proposal.status === "failed" && (
          <ExecutionFailureSection metadata={proposal.metadata} />
        )}

        {/* Approval Notes */}
        {proposal.approvalNotes && proposal.status !== "failed" && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircleIcon className="size-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">
                Approval Note
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {proposal.approvalNotes}
            </p>
          </div>
        )}

        {/* Rejection Notes */}
        {proposal.rejectionNotes && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <XCircleIcon className="size-3.5 text-red-400" />
              <span className="text-[11px] font-semibold text-red-400">
                Rejection Note
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {proposal.rejectionNotes}
            </p>
          </div>
        )}

        {/* Notes input — only while awaiting */}
        {canAct && (
          <div className="space-y-1.5">
            <Label
              htmlFor={`notes-${proposal.id}`}
              className="text-xs text-muted-foreground"
            >
              Notes (optional)
            </Label>
            <Textarea
              id={`notes-${proposal.id}`}
              placeholder="Add context for your decision…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-xs"
            />
          </div>
        )}
      </CardContent>

      {/* ── Footer Actions ─────────────────────────────────────── */}
      {canAct && (
        <CardFooter className="gap-2 border-t border-border/40 bg-muted/20 py-3">
          {onReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="h-8 flex-1 text-xs"
            >
              {isRejecting ? (
                <SpinnerGapIcon className="mr-2 size-3.5 animate-spin" />
              ) : (
                <XCircleIcon className="mr-2 size-3.5" />
              )}
              {isRejecting ? "Rejecting…" : "Reject"}
            </Button>
          )}
          {onApprove && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="h-8 flex-1 text-xs"
            >
              {isApproving ? (
                <SpinnerGapIcon className="mr-2 size-3.5 animate-spin" />
              ) : (
                <CheckCircleIcon className="mr-2 size-3.5" />
              )}
              {isApproving ? "Approving…" : "Approve"}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
