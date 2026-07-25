"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface StatItem {
  value: number
  suffix: string
  label: string
  prefix?: string
}

const STATS: StatItem[] = [
  { value: 10, suffix: "k+", label: "Secrets Stored", prefix: "" },
  { value: 256, suffix: "-bit", label: "AES Encryption", prefix: "" },
  { value: 99.99, suffix: "%", label: "Uptime SLA", prefix: "" },
  { value: 0, suffix: "", label: "Known Breaches", prefix: "" },
]

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const duration = 1800

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            // Easing out
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = value === 0 ? 0 : value * eased
            setDisplayed(current)
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  const formatted =
    value === 0
      ? "0"
      : value % 1 !== 0
      ? displayed.toFixed(2)
      : Math.round(displayed).toLocaleString()

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

interface StatsSectionProps {
  className?: string
}

export function StatsSection({ className }: StatsSectionProps) {
  return (
    <section className={cn("relative py-16 overflow-hidden", className)}>
      {/* Divider lines */}
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border/30" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center text-center gap-1 p-6 rounded-2xl",
                "bg-card/50 border border-border/40 backdrop-blur-sm",
                "hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
              )}
            >
              {/* Animated count */}
              <span className="text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>

              {/* Bottom glow bar */}
              <div className="mt-2 h-0.5 w-8 bg-primary/20 rounded-full group-hover:w-12 group-hover:bg-primary/50 transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
