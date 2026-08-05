"use client"

import Link from "next/link"
import {
  CheckCircleIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react"
import { AgentAvatar } from "@/components/agents/agent-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AgentSessionDto } from "@/hooks/use-agent-sessions"
import { TimeAgo } from "@/components/dashboard/time-ago"

const STATUS_MAP: Record<
  string,
  {
    label: string
    cls: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  completed: {
    label: "Completed",
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: CheckCircleIcon,
  },
  running: {
    label: "Running",
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: SpinnerGapIcon,
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: WarningCircleIcon,
  },
  failed: {
    label: "Failed",
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: WarningCircleIcon,
  },
  idle: {
    label: "Idle",
    cls: "bg-muted text-muted-foreground border-border/40",
    icon: ClockIcon,
  },
}

const TYPE_COLOR: Record<string, string> = {
  coding: "text-blue-400",
  content: "text-violet-400",
  ops: "text-amber-400",
  research: "text-emerald-400",
}

export function AgentStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.idle
  return (
    <Badge
      variant="outline"
      className={cn("h-5 px-1.5 text-[10px] font-semibold", s.cls)}
    >
      {s.label}
    </Badge>
  )
}

export function AgentSessionRow({
  session,
  className,
}: {
  session: AgentSessionDto
  className?: string
}) {
  const statusCfg = STATUS_MAP[session.status] ?? STATUS_MAP.idle
  const StatusIcon = statusCfg.icon

  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30",
        className
      )}
    >
      <StatusIcon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          session.status === "running" && "animate-spin text-blue-400",
          session.status === "completed" && "text-emerald-400",
          session.status === "awaiting_approval" && "text-amber-400",
          session.status === "failed" && "text-red-400",
          session.status === "idle" && "text-muted-foreground"
        )}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <AgentAvatar
            type={session.type}
            status={session.status}
            size="xs"
            showStatus={false}
          />
          <span
            className={cn(
              "text-[10px] font-bold tracking-wide uppercase",
              TYPE_COLOR[session.type] ?? "text-muted-foreground"
            )}
          >
            {session.type} agent
          </span>
          <AgentStatusBadge status={session.status} />
        </div>
        <p className="truncate text-xs font-medium text-foreground">
          {session.name}
        </p>
        {session.currentTask && (
          <p className="truncate text-xs leading-snug text-muted-foreground">
            {session.currentTask}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <TimeAgo date={session.createdAt} className="text-[10px]" />
        <ArrowRightIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}
