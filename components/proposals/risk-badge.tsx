import { cn } from "@/lib/utils"

type RiskLevel = "low" | "medium" | "high" | "critical"
type RiskBadgeSize = "xs" | "sm" | "md"

type RiskBadgeProps = {
  level: RiskLevel
  size?: RiskBadgeSize
  className?: string
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  medium: {
    label: "Medium",
    dot: "bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  high: {
    label: "High",
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
}

const SIZE_CLASSES: Record<RiskBadgeSize, string> = {
  xs: "text-[9px] h-4 px-1.5 gap-1",
  sm: "text-[10px] h-5 px-2 gap-1",
  md: "text-xs h-6 px-2.5 gap-1.5",
}

const DOT_SIZES: Record<RiskBadgeSize, string> = {
  xs: "size-1.5",
  sm: "size-1.5",
  md: "size-2",
}

export function RiskBadge({ level, size = "sm", className }: RiskBadgeProps) {
  const config = RISK_CONFIG[level]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-semibold",
        config.text,
        config.bg,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      <span
        className={cn("shrink-0 rounded-full", config.dot, DOT_SIZES[size])}
      />
      {config.label}
    </span>
  )
}
