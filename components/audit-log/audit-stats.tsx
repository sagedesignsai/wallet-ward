"use client"

import { useMemo } from "react"
import {
  ClipboardTextIcon,
  CalendarIcon,
  CalendarBlankIcon,
  UsersIcon,
} from "@phosphor-icons/react"

import type { AuditLog } from "@/hooks/use-audit-logs"
import { StatCard } from "@/components/dashboard/stat-card"

type AuditStatsProps = {
  logs: AuditLog[]
  isLoading: boolean
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)
  return d >= weekAgo && d <= now
}

export function AuditStats({ logs, isLoading }: AuditStatsProps) {
  const stats = useMemo(() => {
    const total = logs.length
    const today = logs.filter((l) => isToday(l.createdAt)).length
    const thisWeek = logs.filter((l) => isThisWeek(l.createdAt)).length

    const actorSet = new Set<string>()
    for (const log of logs) {
      if (log.actorUserId) actorSet.add(log.actorUserId)
    }

    return {
      total,
      today,
      thisWeek,
      uniqueActors: actorSet.size,
    }
  }, [logs])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Events"
        value={isLoading ? "—" : stats.total}
        icon={<ClipboardTextIcon className="size-4" />}
        description="Loaded so far"
      />
      <StatCard
        label="Today"
        value={isLoading ? "—" : stats.today}
        icon={<CalendarIcon className="size-4" />}
        description="Events today"
      />
      <StatCard
        label="This Week"
        value={isLoading ? "—" : stats.thisWeek}
        icon={<CalendarBlankIcon className="size-4" />}
        description="Last 7 days"
      />
      <StatCard
        label="Unique Actors"
        value={isLoading ? "—" : stats.uniqueActors}
        icon={<UsersIcon className="size-4" />}
        description="Distinct users & keys"
      />
    </div>
  )
}
