import { ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: { value: string; positive?: boolean }
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card size="sm" className={cn("gap-3 px-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold leading-none tracking-tight text-foreground">
            {value}
          </span>
        </div>
        {icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground [&_svg]:size-4">
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <Badge
              variant={trend.positive ? "default" : "destructive"}
              className="gap-0.5 px-1.5 tabular-nums"
            >
              {trend.positive ? (
                <ArrowUpRight className="size-2.5" />
              ) : (
                <ArrowDownRight className="size-2.5" />
              )}
              {trend.value}
            </Badge>
          )}
          {description && (
            <span className="text-xs text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
