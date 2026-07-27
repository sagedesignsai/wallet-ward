"use client"

import {
  CodeIcon,
  PencilSimpleIcon,
  GearIcon,
  MagnifyingGlassIcon,
  RobotIcon,
  SpinnerGapIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type AgentType = "coding" | "content" | "ops" | "research"
type AgentStatus =
  "idle" | "running" | "awaiting_approval" | "completed" | "failed"
type AvatarSize = "xs" | "sm" | "md" | "lg"

interface AgentAvatarProps {
  type?: AgentType | string
  size?: AvatarSize
  status?: AgentStatus | string
  showStatus?: boolean
  className?: string
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; weight?: string }>
    color: string
    bg: string
    border: string
  }
> = {
  coding: {
    icon: CodeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
  },
  content: {
    icon: PencilSimpleIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/25",
  },
  ops: {
    icon: GearIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
  },
  research: {
    icon: MagnifyingGlassIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
  },
}

const FALLBACK_CONFIG = {
  icon: RobotIcon,
  color: "text-primary",
  bg: "bg-primary/15",
  border: "border-primary/25",
}

const STATUS_DOT: Record<
  string,
  {
    color: string
    pulse: boolean
    icon?: React.ComponentType<{ className?: string }>
  }
> = {
  idle: { color: "bg-muted-foreground", pulse: false },
  running: { color: "bg-blue-400", pulse: true },
  awaiting_approval: { color: "bg-amber-400", pulse: true },
  completed: { color: "bg-emerald-400", pulse: false },
  failed: { color: "bg-red-400", pulse: false },
}

const SIZE_CLASSES: Record<
  AvatarSize,
  { wrapper: string; icon: string; dot: string; dotOffset: string }
> = {
  xs: {
    wrapper: "size-6  rounded-md",
    icon: "size-3",
    dot: "size-1.5",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
  sm: {
    wrapper: "size-8  rounded-lg",
    icon: "size-4",
    dot: "size-2",
    dotOffset: "-bottom-0.5 -right-0.5",
  },
  md: {
    wrapper: "size-10 rounded-xl",
    icon: "size-5",
    dot: "size-2.5",
    dotOffset: "-bottom-1   -right-1",
  },
  lg: {
    wrapper: "size-12 rounded-xl",
    icon: "size-6",
    dot: "size-3",
    dotOffset: "-bottom-1   -right-1",
  },
}

export function AgentAvatar({
  type = "coding",
  size = "sm",
  status,
  showStatus = true,
  className,
}: AgentAvatarProps) {
  const typeKey = typeof type === "string" ? type.toLowerCase() : "coding"
  const config = TYPE_CONFIG[typeKey] ?? FALLBACK_CONFIG
  const Icon = config.icon
  const sizes = SIZE_CLASSES[size]
  const statusDot = status ? STATUS_DOT[status] : null

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center border",
          config.bg,
          config.border,
          config.color,
          sizes.wrapper
        )}
      >
        <Icon className={sizes.icon} weight="duotone" />
      </div>

      {showStatus && statusDot && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-background",
            sizes.dot,
            sizes.dotOffset,
            statusDot.color,
            statusDot.pulse && "animate-pulse"
          )}
        />
      )}
    </div>
  )
}
