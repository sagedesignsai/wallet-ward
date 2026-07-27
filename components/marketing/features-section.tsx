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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle
          cx="16"
          cy="12"
          r="2"
          fill="currentColor"
          opacity="0.4"
          className="transition-opacity duration-300 group-hover:opacity-80"
        />
        <path
          d="M8 28c0-4.418 3.582-8 8-8s8 3.582 8 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="20"
          className="transition-all duration-700 group-hover:[stroke-dashoffset:0]"
        />
        <path
          d="M24 10l3-3M24 14h3M24 18l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0"
          className="transition-opacity delay-300 duration-500 group-hover:opacity-60"
        />
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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <rect
          x="7"
          y="13"
          width="18"
          height="15"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M11 13V9a5 5 0 0110 0v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="16" cy="20.5" r="2.5" fill="currentColor" opacity="0.4">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <path
          d="M16 20.5v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <rect
          x="22"
          y="5"
          width="8"
          height="6"
          rx="3"
          fill="oklch(0.148 0.004 228.8)"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <text
          x="26"
          y="9.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="4.5"
          fontWeight="bold"
          fontFamily="monospace"
          className="opacity-0 transition-opacity delay-200 duration-300 group-hover:opacity-100"
        >
          v3
        </text>
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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <rect
          x="4"
          y="6"
          width="24"
          height="18"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4 11h24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8.5" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="11.5" cy="8.5" r="1" fill="currentColor" opacity="0.4" />
        <path
          d="M8 16l3 2-3 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10"
          strokeDashoffset="10"
          className="transition-all delay-100 duration-500 group-hover:[stroke-dashoffset:0]"
        />
        <path
          d="M15 20h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6"
          strokeDashoffset="6"
          className="transition-all delay-300 duration-500 group-hover:[stroke-dashoffset:0]"
        />
        <rect
          x="8"
          y="26"
          width="16"
          height="2"
          rx="1"
          fill="currentColor"
          opacity="0.2"
        />
        <rect
          x="14"
          y="24"
          width="4"
          height="2"
          fill="currentColor"
          opacity="0.2"
        />
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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="6" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle
          cx="26"
          cy="8"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="6"
          cy="24"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="26"
          cy="24"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {[
          "M13 13.5L8 10",
          "M19 13.5L24 10",
          "M13 18.5L8 22",
          "M19 18.5L24 22",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="8"
            strokeDashoffset="8"
            className={`transition-all duration-500 group-hover:[stroke-dashoffset:0] delay-${i * 75}`}
          />
        ))}
        <circle
          cx="16"
          cy="16"
          r="1.5"
          fill="currentColor"
          className="opacity-0 transition-opacity delay-500 duration-300 group-hover:opacity-100"
        />
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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="18"
          y="18"
          width="10"
          height="10"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M20.5 23l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10"
          strokeDashoffset="10"
          className="transition-all delay-200 duration-500 group-hover:[stroke-dashoffset:0]"
        />
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
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <line
          x1="10"
          y1="6"
          x2="10"
          y2="26"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="20"
          className="transition-all duration-600 group-hover:[stroke-dashoffset:0]"
        />
        {[9, 16, 23].map((cy, i) => (
          <g key={cy}>
            <circle
              cx="10"
              cy={cy}
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="10"
              cy={cy}
              r="1"
              fill="currentColor"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ transitionDelay: `${300 + i * 100}ms` }}
            />
          </g>
        ))}
        <rect
          x="16"
          y="7"
          width="12"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.4"
        />
        <rect
          x="16"
          y="14.5"
          width="10"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.3"
        />
        <rect
          x="16"
          y="21.5"
          width="12"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.2"
        />
      </svg>
    ),
  },
]

export function FeaturesSection({ className }: { className?: string }) {
  return (
    <section id="features" className={cn("relative py-24", className)}>
      <div className="container mx-auto px-6">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Platform Capabilities
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Security-first. Agent-powered. Tool-agnostic.
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            Flowspace combines an enterprise-grade credential vault with
            autonomous AI agents that work inside your existing tools — not
            instead of them.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6",
                "border bg-card/50 backdrop-blur-sm",
                "hover:bg-card/80 hover:shadow-xl",
                feature.accentBorder,
                feature.glowColor,
                "cursor-default transition-all duration-300"
              )}
            >
              {/* Accent bar on hover */}
              <div
                className={cn(
                  "absolute top-0 right-0 left-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
                  feature.accentBg.replace("/10", "").replace("bg-", "bg-")
                )}
                style={{ background: "currentColor" }}
              />

              {/* Corner glow */}
              <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 overflow-hidden rounded-2xl">
                <div
                  className={cn(
                    "absolute top-2 right-2 h-10 w-10 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-25",
                    feature.accentBg
                  )}
                />
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                  feature.accentBg,
                  feature.accentBorder,
                  feature.color
                )}
              >
                {feature.icon}
              </div>

              {/* Text */}
              <div className="relative z-10 space-y-1.5">
                <h3 className="text-sm font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>

              {/* Bottom hover line */}
              <div
                className={cn(
                  "absolute right-6 bottom-0 left-6 h-0.5 origin-left scale-x-0 rounded-full opacity-40 transition-transform duration-500 group-hover:scale-x-100",
                  feature.accentBg
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
