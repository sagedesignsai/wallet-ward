"use client"

import React from "react"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    title: "Zero-Knowledge Encryption",
    description:
      "Your secrets are encrypted client-side before leaving your device. We never see your plaintext data.",
    color: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <path
          d="M16 4L6 9v8c0 7 4.5 12 10 15 5.5-3 10-8 10-15V9L16 4z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="group-hover:stroke-[2.2] transition-all duration-300"
        />
        <path
          d="M11 16l3.5 3.5L21 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="14"
          strokeDashoffset="14"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500"
        />
      </svg>
    ),
  },
  {
    title: "Team Access Control",
    description:
      "Fine-grained RBAC with read/write/admin roles. Share secrets securely across teams and organizations.",
    color: "text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="21" cy="11" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 26c0-4.418 3.582-8 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M29 26c0-4.418-3.582-8-8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M13 18h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="8"
          strokeDashoffset="8"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-500 delay-100"
        />
      </svg>
    ),
  },
  {
    title: "API Key Management",
    description:
      "Generate, rotate, and revoke API keys with usage analytics, rate limiting, and metadata tagging.",
    color: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <path
          d="M14 18a6 6 0 100-12 6 6 0 000 12z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M14 18l-1.5 3 3 1.5-1.5 3L18 28"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="16"
          strokeDashoffset="16"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-600 delay-150"
        />
        <circle cx="11" cy="11" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Two-Factor Auth (2FA)",
    description:
      "Protect your vault with TOTP-based 2FA. Compatible with Google Authenticator, Authy, 1Password, and more.",
    color: "text-green-400",
    glowColor: "group-hover:shadow-green-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <rect x="8" y="4" width="16" height="24" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="11" y="8" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="22" r="2" fill="currentColor">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <path d="M13 22h-2M19 22h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Audit Logs",
    description:
      "Complete tamper-evident audit trail for every access and mutation. Export as JSON or CSV for compliance.",
    color: "text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeDasharray="12 12 8"
          strokeDashoffset="0"
          className="group-hover:animate-[dash_1s_ease-in-out]"
        />
        <circle cx="23" cy="23" r="5" fill="oklch(0.148 0.004 228.8)" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 23l1.5 1.5L25 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Secret Versioning",
    description:
      "Full version history for every secret. Rollback instantly to any previous value with one click.",
    color: "text-rose-400",
    glowColor: "group-hover:shadow-rose-500/20",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 transition-transform group-hover:scale-110 duration-300">
        <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="20" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="20" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeDasharray="6"
          strokeDashoffset="6"
          className="group-hover:[stroke-dashoffset:0] transition-all duration-400"
        />
        <path
          d="M10 26c0-3.314 2.686-6 6-6s6 2.686 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8 5l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"
        />
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
            Built for security-first teams
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            From solo developers to enterprise teams — Wallet Ward adapts to your workflow without compromising on security.
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
