"use client"

import React from "react"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    title: "Unified Workspace",
    description:
      "Projects, documents, tasks, and secrets — everything lives in one place. No more tab-switching between disconnected tools.",
    color: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* Dashboard grid icon */}
        <rect x="4" y="4" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8"
          strokeDasharray="28"
          strokeDashoffset="28"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500"
        />
        <rect x="17" y="4" width="11" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.8"
          strokeDasharray="22"
          strokeDashoffset="22"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100"
        />
        <rect x="4" y="17" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8"
          strokeDasharray="28"
          strokeDashoffset="28"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-150"
        />
        <rect x="17" y="13" width="11" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8"
          strokeDasharray="34"
          strokeDashoffset="34"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-200"
        />
        <circle cx="10" cy="9.5" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500" />
        <rect x="20" y="6.5" width="5" height="1.5" rx="0.75" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500" />
      </svg>
    ),
  },
  {
    title: "Tool Integrations",
    description:
      "Connect GitHub, Linear, Vercel, and Slack via OAuth. Your existing workflow stays intact — Nimbus just brings it all together.",
    color: "text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* Connected nodes icon */}
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="6" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12.5 13L8.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500"
        />
        <path d="M19.5 13L23.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100"
        />
        <path d="M12.5 19L8.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-150"
        />
        <path d="M19.5 19L23.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-200"
        />
      </svg>
    ),
  },
  {
    title: "Team Collaboration",
    description:
      "Organizations, members, roles, and permissions. Invite your team, set granular access, and collaborate without friction.",
    color: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* People with roles */}
        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300" />
        <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="6" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 28c0-3 2-5.5 5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500"
        />
        <path d="M31 28c0-3-2-5.5-5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100"
        />
        {/* Role badge */}
        <rect x="21" y="6" width="8" height="5" rx="2.5" fill="oklch(0.148 0.004 228.8)" stroke="currentColor" strokeWidth="1.2" />
        <path d="M23.5 8.5L25 10L27 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400"
        />
      </svg>
    ),
  },
  {
    title: "Activity Feed",
    description:
      "A unified timeline across all connected tools. See who did what, when — commits, deployments, task updates, and doc changes.",
    color: "text-green-400",
    glowColor: "group-hover:shadow-green-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* Timeline with entries */}
        <line x1="10" y1="6" x2="10" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="20"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-600"
        />
        {/* Entry dots */}
        <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="9" r="1" fill="currentColor"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300"
        />
        <circle cx="10" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="16" r="1" fill="currentColor"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400"
        />
        <circle cx="10" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="23" r="1" fill="currentColor"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500"
        />
        {/* Content lines */}
        <rect x="16" y="7" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="16" y="14" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
        <rect x="16" y="21" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        {/* Sub-detail lines */}
        <rect x="16" y="11" width="7" height="2" rx="1" fill="currentColor" opacity="0.2" />
        <rect x="16" y="18" width="9" height="2" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    title: "Secrets Management",
    description:
      "Encrypted, versioned, and scoped to environments. Dev, staging, and production secrets — managed alongside your projects.",
    color: "text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* Lock with versioning */}
        <rect x="8" y="14" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 14V10a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="21" r="2" fill="currentColor">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        {/* Version badge */}
        <rect x="20" y="6" width="9" height="6" rx="3" fill="oklch(0.148 0.004 228.8)" stroke="currentColor" strokeWidth="1.2" />
        <text x="24.5" y="10.5" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="bold" fontFamily="sans-serif"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300"
        >
          v3
        </text>
        {/* Environment indicator */}
        <circle cx="6" cy="21" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="17" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="6" cy="13" r="1.5" fill="currentColor" opacity="0.8" />
      </svg>
    ),
  },
  {
    title: "API-First",
    description:
      "A full REST API for everything. Build custom workflows, automate deployments, and integrate Nimbus into any pipeline.",
    color: "text-rose-400",
    glowColor: "group-hover:shadow-rose-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        {/* Code brackets with arrow */}
        <path d="M10 8L4 16L10 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="26"
          strokeDashoffset="26"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500"
        />
        <path d="M22 8L28 16L22 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="26"
          strokeDashoffset="26"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100"
        />
        <path d="M18 6L14 26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="20"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-200"
        />
        {/* Pulse dots on endpoints */}
        <circle cx="4" cy="16" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400">
          <animate attributeName="r" values="1.5;2;1.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="16" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-400">
          <animate attributeName="r" values="1.5;2;1.5" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
        </circle>
      </svg>
    ),
  },
]

interface FeaturesSectionProps {
  className?: string
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section id="features" className={cn("py-24 relative", className)}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Everything You Need
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Built for modern remote teams
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            From solo developers to enterprise teams — Nimbus adapts to your workflow without forcing you to change how you work.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group relative flex flex-col gap-4 p-6 rounded-2xl",
                "border border-border/40 bg-card/50 backdrop-blur-sm",
                "hover:border-border/70 hover:bg-card/80 hover:shadow-xl",
                feature.glowColor,
                "transition-all duration-300 cursor-default"
              )}
            >
              {/* Animated corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-2xl">
                <div className={cn(
                  "absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-lg",
                  feature.color.replace("text-", "bg-")
                )} />
              </div>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-foreground/5 border border-border/50 group-hover:border-current/30",
                "transition-all duration-300",
                feature.color
              )}>
                {feature.icon}
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-foreground group-hover:text-foreground/90 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom hover line */}
              <div className={cn(
                "absolute bottom-0 left-6 right-6 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left",
                feature.color.replace("text-", "bg-").replace("-400", "-500/40")
              )} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
