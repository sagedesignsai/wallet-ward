"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

function getRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 5) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return "yesterday"
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 4) return `${diffWeek}w ago`
  if (diffMonth < 12) return `${diffMonth}mo ago`
  return `${diffYear}y ago`
}

type TimeAgoProps = {
  date: Date | string | number
  className?: string
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const d =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date

  const [, setTick] = useState(0)

  useEffect(() => {
    // Refresh every 60s to keep relative time accurate
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString()}
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
    >
      {getRelativeTime(d)}
    </time>
  )
}
