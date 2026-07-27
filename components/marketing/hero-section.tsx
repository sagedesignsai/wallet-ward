"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen items-center overflow-hidden pt-16",
        className
      )}
    >
      {/* Background blobs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -right-24 h-80 w-80 animate-[pulse_10s_ease-in-out_2s_infinite] rounded-full bg-violet-500/7 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 animate-[pulse_7s_ease-in-out_1s_infinite] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-16 py-16 lg:grid-cols-2">
          {/* LEFT: Text content */}
          <div className="flex max-w-xl flex-col gap-7">
            {/* Eyebrow */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary">
                Autonomous Execution Platform
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-5xl leading-[1.05] font-black tracking-tight text-foreground sm:text-6xl">
                Your AI Workforce.
              </h1>
              <div className="text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl">
                <span className="animate-[pulse_4s_ease-in-out_infinite] bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Runs While You Sleep.
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p className="text-base leading-relaxed text-muted-foreground">
              Flowspace gives your team autonomous AI agents secured by an
              enterprise-grade encrypted vault. Connect your existing tools.
              Delegate the work. Stay in control.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2.5">
              {[
                "Daytona Sandboxes",
                "Zero-Leak Security",
                "Autonomous Agents",
                "Augments Your Tools",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-foreground/[0.03] px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="h-3 w-3 text-emerald-400"
                  >
                    <circle
                      cx="6"
                      cy="6"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeOpacity="0.5"
                    />
                    <path
                      d="M3.5 6L5 7.5L8.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 font-semibold shadow-xl shadow-primary/20 transition-shadow duration-300 hover:shadow-primary/30"
              >
                <Link href="/sign-up">
                  Start Free
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path
                      d="M4 10h12M10 4l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 font-semibold backdrop-blur-sm"
              >
                <Link href="/#features">See How It Works</Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2">
                {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {["A", "B", "C", "D"][i]}
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">1,200+</span>{" "}
                teams running agents on Flowspace
              </p>
            </div>
          </div>

          {/* RIGHT: Animated platform visual */}
          <div className="relative hidden h-[520px] items-center justify-center lg:flex">
            <div className="relative flex h-full w-full items-center justify-center">
              {/* Central hub */}
              <div className="absolute z-20 flex flex-col items-center gap-2">
                <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/15 shadow-2xl shadow-primary/20 backdrop-blur-sm">
                  <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    className="h-10 w-10 text-primary"
                  >
                    <rect
                      x="6"
                      y="10"
                      width="28"
                      height="22"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M6 16h28"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="11"
                      cy="13"
                      r="1.5"
                      fill="currentColor"
                      opacity="0.6"
                    />
                    <circle
                      cx="16"
                      cy="13"
                      r="1.5"
                      fill="currentColor"
                      opacity="0.4"
                    />
                    <rect
                      x="11"
                      y="20"
                      width="8"
                      height="6"
                      rx="1.5"
                      fill="currentColor"
                      opacity="0.2"
                    />
                    <rect
                      x="21"
                      y="20"
                      width="8"
                      height="3"
                      rx="1.5"
                      fill="currentColor"
                      opacity="0.3"
                    />
                    <rect
                      x="21"
                      y="25"
                      width="5"
                      height="1.5"
                      rx="0.75"
                      fill="currentColor"
                      opacity="0.2"
                    />
                  </svg>
                </div>
                <span className="text-xs font-black tracking-widest text-primary uppercase">
                  FLOWSPACE
                </span>
              </div>

              {/* Orbiting nodes */}
              {[
                {
                  label: "Coding Agent",
                  color: "#3b82f6",
                  angle: -70,
                  r: 180,
                  icon: "⌨",
                },
                {
                  label: "Vault",
                  color: "#06b6d4",
                  angle: -10,
                  r: 170,
                  icon: "🔒",
                },
                {
                  label: "Content Agent",
                  color: "#8b5cf6",
                  angle: 50,
                  r: 175,
                  icon: "✍",
                },
                {
                  label: "GitHub",
                  color: "#10b981",
                  angle: 110,
                  r: 172,
                  icon: "⎇",
                },
                {
                  label: "Ops Agent",
                  color: "#f59e0b",
                  angle: 170,
                  r: 178,
                  icon: "⚙",
                },
                {
                  label: "Slack",
                  color: "#ec4899",
                  angle: -130,
                  r: 168,
                  icon: "💬",
                },
              ].map((node) => {
                const rad = (node.angle * Math.PI) / 180
                const x = 50 + (node.r / 5.2) * Math.cos(rad)
                const y = 50 + (node.r / 5.2) * Math.sin(rad)
                return (
                  <div
                    key={node.label}
                    className="absolute z-10 flex flex-col items-center gap-1.5 transition-transform duration-300 hover:scale-110"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl border text-lg shadow-xl backdrop-blur-sm"
                      style={{
                        borderColor: `${node.color}40`,
                        backgroundColor: `${node.color}15`,
                        boxShadow: `0 0 20px ${node.color}20`,
                      }}
                    >
                      {node.icon}
                    </div>
                    <span className="text-[9px] font-bold tracking-wide whitespace-nowrap text-muted-foreground">
                      {node.label}
                    </span>
                  </div>
                )
              })}

              {/* Connecting lines SVG */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {[
                  { x1: 50, y1: 50, x2: 16.5, y2: 27 },
                  { x1: 50, y1: 50, x2: 82.7, y2: 38 },
                  { x1: 50, y1: 50, x2: 83.5, y2: 64 },
                  { x1: 50, y1: 50, x2: 50, y2: 84 },
                  { x1: 50, y1: 50, x2: 17, y2: 83 },
                  { x1: 50, y1: 50, x2: 17, y2: 50 },
                ].map((line, i) => (
                  <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="oklch(0.5 0.1 250)"
                    strokeWidth="0.3"
                    strokeDasharray="2 1.5"
                    strokeOpacity="0.35"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
