"use client"

import React from "react"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    title: "Autonomous Agents",
    description:
      "Coding, Content, Ops, and Research agents that execute multi-step tasks independently — from scaffolding apps to drafting content to managing deployments.",
    color: "text-primary",
    glowColor: "group-hover:shadow-primary/20",
    accentBg: "bg-primary/10",
    accentBorder: "border-primary/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.4" className="group-hover:opacity-80 transition-opacity duration-300" />
        <path d="M8 28c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="20" strokeDashoffset="20" className="group-hover:[stroke-dashoffset:0] transition-all duration-700" />
        <path d="M24 10l3-3M24 14h3M24 18l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0" className="group-hover:opacity-60 transition-opacity duration-500 delay-300" />
      </svg>
    ),
  },
  {
    title: "Encrypted Credential Vault",
    description:
      "AES-256-GCM envelope encryption with per-organization keys, versioned secret history, and environment scoping. Your API keys survive machine failures.",
    color: "text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <rect x="7" y="13" width="18" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 13V9a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="20.5" r="2.5" fill="currentColor" opacity="0.4">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M16 20.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <rect x="22" y="5" width="8" height="6" rx="3" fill="oklch(0.148 0.004 228.8)" stroke="currentColor" strokeWidth="1.2" />
        <text x="26" y="9.5" textAnchor="middle" fill="currentColor" fontSize="4.5" fontWeight="bold" fontFamily="monospace" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">v3</text>
      </svg>
    ),
  },
  {
    title: "Daytona Sandbox Execution",
    description:
      "Agents run code inside isolated cloud sandboxes — no leaking into production. Stream live terminal output and see web previews directly inside Flowspace.",
    color: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <rect x="4" y="6" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 11h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="8.5" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="11.5" cy="8.5" r="1" fill="currentColor" opacity="0.4" />
        <path d="M8 16l3 2-3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10" strokeDashoffset="10" className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100" />
        <path d="M15 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6" strokeDashoffset="6" className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-300" />
        <rect x="8" y="26" width="16" height="2" rx="1" fill="currentColor" opacity="0.2" />
        <rect x="14" y="24" width="4" height="2" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    title: "Tool Augmentation",
    description:
      "Agents use your GitHub, Slack, Vercel, and Google Workspace accounts to do real work. No replacing tools — just making them smarter and faster.",
    color: "text-violet-400",
    glowColor: "group-hover:shadow-violet-500/20",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="6" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="24" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="24" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        {[
          "M13 13.5L8 10", "M19 13.5L24 10",
          "M13 18.5L8 22", "M19 18.5L24 22",
        ].map((d, i) => (
          <path key={i} d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="8" strokeDashoffset="8" className={`group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-${i * 75}`} />
        ))}
        <circle cx="16" cy="16" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500" />
      </svg>
    ),
  },
  {
    title: "Human-in-the-Loop Controls",
    description:
      "Agents don't act unilaterally. They draft, plan, and propose — you review and approve. Fine-grained permission scopes for every action.",
    color: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="18" y="18" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20.5 23l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10" strokeDashoffset="10" className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-200" />
      </svg>
    ),
  },
  {
    title: "Compliance & Audit Trail",
    description:
      "Every agent action, credential access, and tool call is logged with actor, timestamp, and IP. Full audit export for SOC 2 and security teams.",
    color: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/25",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <line x1="10" y1="6" x2="10" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="20" strokeDashoffset="20" className="group-hover:[stroke-dashoffset:0] transition-all duration-600" />
        {[9, 16, 23].map((cy, i) => (
          <g key={cy}>
            <circle cx="10" cy={cy} r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy={cy} r="1" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transitionDelay: `${300 + i * 100}ms` }} />
          </g>
        ))}
        <rect x="16" y="7" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
        <rect x="16" y="14.5" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="16" y="21.5" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
]

export function FeaturesSection({ className }: { className?: string }) {
  return (
    <section id="features" className={cn("py-24 relative", className)}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Security-first. Agent-powered. Tool-agnostic.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Flowspace combines an enterprise-grade credential vault with autonomous AI agents that work inside your existing tools — not instead of them.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden",
                "border bg-card/50 backdrop-blur-sm",
                "hover:bg-card/80 hover:shadow-xl",
                feature.accentBorder,
                feature.glowColor,
                "transition-all duration-300 cursor-default"
              )}
            >
              {/* Accent bar on hover */}
              <div className={cn("absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left", feature.accentBg.replace("/10", "").replace("bg-", "bg-"))} style={{ background: "currentColor" }} />

              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-2xl pointer-events-none">
                <div className={cn("absolute top-2 right-2 w-10 h-10 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-500 blur-xl", feature.accentBg)} />
              </div>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 relative z-10",
                feature.accentBg, feature.accentBorder, feature.color
              )}>
                {feature.icon}
              </div>

              {/* Text */}
              <div className="space-y-1.5 relative z-10">
                <h3 className="font-bold text-foreground text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>

              {/* Bottom hover line */}
              <div className={cn(
                "absolute bottom-0 left-6 right-6 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-40",
                feature.accentBg
              )} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
