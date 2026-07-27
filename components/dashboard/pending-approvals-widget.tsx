"use client"

import Link from "next/link"
import {
  ClockIcon,
  ArrowRightIcon,
  WarningCircleIcon,
  RocketLaunchIcon,
  CodeIcon,
  PencilSimpleIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react"

import { usePendingApprovals } from "@/hooks/use-pending-approvals"
import { RiskBadge } from "@/components/proposals/risk-badge"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ActionProposalDto } from "@/components/proposals/approval-card"

const AGENT_TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  coding: CodeIcon,
  content: PencilSimpleIcon,
  ops: GearIcon,
  research: MagnifyingGlassIcon,
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  deploy: "Deploy",
  publish: "Publish",
  delete: "Delete",
  rotate_secret: "Rotate Secret",
  grant_access: "Grant Access",
}

function ProposalRow({ proposal }: { proposal: ActionProposalDto }) {
  return (
    <Link
      href={`/dashboard/proposals/${proposal.id}`}
      className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
    >
      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-snug font-medium text-foreground">
          {proposal.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {ACTION_TYPE_LABELS[proposal.actionType] ?? proposal.actionType}
          </span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {proposal.targetSystem}
          </span>
        </div>
      </div>
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

export function PendingApprovalsWidget() {
  const { proposals, count, isLoading, lastFetchedAt } = usePendingApprovals()

  if (isLoading) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/3">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-amber-400" weight="duotone" />
            <CardTitle className="text-sm">Pending Approval</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <SpinnerGapIcon className="size-3.5 animate-spin" />
            Checking for pending actions…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (count === 0) return null

  return (
    <Card
      className={cn(
        "border-amber-500/30 bg-amber-500/5",
        count > 0 && "shadow-sm shadow-amber-500/10"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircleIcon
              className="size-4 text-amber-400"
              weight="duotone"
            />
            <CardTitle className="text-sm">Pending Your Approval</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {lastFetchedAt && (
              <span className="hidden text-[10px] text-muted-foreground sm:inline">
                updated <TimeAgo date={lastFetchedAt} />
              </span>
            )}
            <Badge
              variant="outline"
              className="h-5 border-amber-500/30 bg-amber-500/15 px-2 text-[10px] font-bold text-amber-400"
            >
              {count} action{count !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0.5 pb-3">
        {proposals.slice(0, 5).map((proposal) => (
          <ProposalRow key={proposal.id} proposal={proposal} />
        ))}

        {count > 5 && (
          <p className="px-3 pt-1 text-[10px] text-muted-foreground">
            +{count - 5} more pending
          </p>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 w-full border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
          >
            <Link href="/dashboard/proposals?status=awaiting_approval">
              <RocketLaunchIcon className="mr-2 size-3.5" />
              Review All Pending
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
