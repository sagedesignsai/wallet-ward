"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STATS = [
  {
    value: "AES-256",
    label: "Encryption Standard",
    sub: "GCM envelope encryption",
    color: "text-cyan-400",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
  {
    value: "4",
    label: "Autonomous Agent Types",
    sub: "Coding, Content, Ops, Research",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  {
    value: "8",
    label: "Secret Types Supported",
    sub: "Env, SSH, Certs, API Tokens & more",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
  },
  {
    value: "100%",
    label: "Audit Coverage",
    sub: "Every agent action logged",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
  },
]

export function StatsSection({ className }: { className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className={cn("py-16 border-y border-border/30 relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center text-center gap-2 p-5 rounded-2xl border transition-all duration-700",
                stat.bg, stat.border,
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className={cn("text-3xl sm:text-4xl font-black tracking-tight", stat.color)}>
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-foreground">{stat.label}</span>
              <span className="text-[11px] text-muted-foreground">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
