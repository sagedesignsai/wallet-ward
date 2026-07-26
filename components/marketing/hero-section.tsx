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
        "relative min-h-screen flex items-center overflow-hidden pt-16",
        className
      )}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-violet-500/7 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_2s_infinite]" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-[pulse_7s_ease-in-out_1s_infinite]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-4rem)] py-16">

          {/* LEFT: Text content */}
          <div className="flex flex-col gap-7 max-w-xl">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-semibold text-primary tracking-wide">
                Autonomous Execution Platform
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
                Your AI Workforce.
              </h1>
              <div className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent animate-[pulse_4s_ease-in-out_infinite]">
                  Runs While You Sleep.
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p className="text-muted-foreground text-base leading-relaxed">
              Flowspace gives your team autonomous AI agents secured by an enterprise-grade encrypted vault.
              Connect your existing tools. Delegate the work. Stay in control.
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border/50 px-2.5 py-1 rounded-full bg-foreground/[0.03]"
                >
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-emerald-400">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
                    <path d="M3.5 6L5 7.5L8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="font-semibold gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow duration-300"
              >
                <Link href="/sign-up">
                  Start Free
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                    <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-semibold gap-2 backdrop-blur-sm"
              >
                <Link href="/#features">
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2">
                {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {["A", "B", "C", "D"][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">1,200+</span> teams running agents on Flowspace
              </p>
            </div>
          </div>

          {/* RIGHT: Animated platform visual */}
          <div className="relative hidden lg:flex items-center justify-center h-[520px]">
            <div className="relative w-full h-full flex items-center justify-center">

              {/* Central hub */}
              <div className="absolute z-20 flex flex-col items-center gap-2">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/15 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm">
                  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 text-primary">
                    <rect x="6" y="10" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M6 16h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="11" cy="13" r="1.5" fill="currentColor" opacity="0.6" />
                    <circle cx="16" cy="13" r="1.5" fill="currentColor" opacity="0.4" />
                    <rect x="11" y="20" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.2" />
                    <rect x="21" y="20" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
                    <rect x="21" y="25" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.2" />
                  </svg>
                </div>
                <span className="text-xs font-black text-primary tracking-widest uppercase">FLOWSPACE</span>
              </div>

              {/* Orbiting nodes */}
              {[
                { label: "Coding Agent", color: "#3b82f6", angle: -70, r: 180, icon: "⌨" },
                { label: "Vault", color: "#06b6d4", angle: -10, r: 170, icon: "🔒" },
                { label: "Content Agent", color: "#8b5cf6", angle: 50, r: 175, icon: "✍" },
                { label: "GitHub", color: "#10b981", angle: 110, r: 172, icon: "⎇" },
                { label: "Ops Agent", color: "#f59e0b", angle: 170, r: 178, icon: "⚙" },
                { label: "Slack", color: "#ec4899", angle: -130, r: 168, icon: "💬" },
              ].map((node) => {
                const rad = (node.angle * Math.PI) / 180
                const x = 50 + (node.r / 5.2) * Math.cos(rad)
                const y = 50 + (node.r / 5.2) * Math.sin(rad)
                return (
                  <div
                    key={node.label}
                    className="absolute z-10 flex flex-col items-center gap-1.5 transition-transform hover:scale-110 duration-300"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl border shadow-xl backdrop-blur-sm text-lg"
                      style={{ borderColor: `${node.color}40`, backgroundColor: `${node.color}15`, boxShadow: `0 0 20px ${node.color}20` }}
                    >
                      {node.icon}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground tracking-wide whitespace-nowrap">{node.label}</span>
                  </div>
                )
              })}

              {/* Connecting lines SVG */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
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

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
