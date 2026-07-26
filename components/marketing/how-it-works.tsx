"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    title: "Secure Your Credentials",
    description:
      "Add API keys, tokens, and environment variables to your encrypted Vault. AES-256-GCM encryption ensures nothing is ever stored in plaintext — even if your machine dies, your keys survive.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.5" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Connect Your Tools",
    description:
      "Link GitHub, Slack, Vercel, and Google Workspace via OAuth. Flowspace augments your existing stack — your team keeps working in the tools they know.",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Assign a Task to an Agent",
    description:
      "Prompt an agent with a goal: 'Build a landing page', 'Draft our newsletter', 'Send a Slack summary of this week's deployments'. The agent plans, executes, and reports back.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M5 21c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 2l1.5 1.5L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="3" r="1" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Review, Approve & Ship",
    description:
      "Agents draft and propose — you approve. Every action is logged in the audit trail. One click to deploy to Vercel, push to GitHub, or publish to Slack.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function HowItWorksSection({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className={cn("py-24 relative overflow-hidden", className)}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Simple by Design
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Four steps to autonomous execution.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            From credential setup to agent-powered delivery — without rebuilding your workflow from scratch.
          </p>
        </div>

        {/* Step grid */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent hidden lg:block" aria-hidden />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center text-center gap-5 transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Icon circle */}
                <div className={cn(
                  "relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-xl",
                  step.bgColor, step.borderColor, step.color,
                )}>
                  {step.icon}
                  {/* Step number badge */}
                  <div className={cn(
                    "absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center bg-background border-2 text-[11px] font-black",
                    step.borderColor, step.color
                  )}>
                    {i + 1}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", step.color)}>
                    Step {step.number}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
