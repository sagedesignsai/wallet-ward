"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    title: "Create Your Workspace",
    description:
      "Set up your organization, invite team members, and define roles and permissions. Your workspace is ready in minutes.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        {/* Building / org icon */}
        <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="15" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
        <rect x="13" y="15" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Connect Your Tools",
    description:
      "Link GitHub, Linear, Vercel, and Slack via OAuth. One-click integrations — no API keys to wrangle or webhooks to configure.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        {/* Plug / connection icon */}
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Work Together",
    description:
      "Write docs, manage tasks, store secrets, and track activity — all in one place. Everything syncs in real-time across your team.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        {/*协作 / workspace icon */}
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Mini content indicators */}
        <circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.5" />
        <rect x="12" y="5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
        <rect x="12" y="11" width="4" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
        <rect x="5" y="12" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="5" y="16" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.2" />
        <rect x="12" y="15" width="6" height="4" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
]

interface HowItWorksSectionProps {
  className?: string
}

function ConnectingPath({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      viewBox="0 0 600 60"
      className="absolute top-8 left-1/2 -translate-x-1/2 w-[85%] hidden lg:block"
      aria-hidden="true"
    >
      <path
        d="M60 30 Q200 5 300 30 Q400 55 540 30"
        fill="none"
        stroke="oklch(0.5 0.1 240)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeOpacity="0.4"
      />
      {/* Animated dot traveling the path */}
      <circle r="4" fill="oklch(0.6 0.18 242)" opacity={isVisible ? 1 : 0}>
        <animateMotion
          path="M60 30 Q200 5 300 30 Q400 55 540 30"
          dur="3s"
          repeatCount="indefinite"
          begin={isVisible ? "0s" : "indefinite"}
        />
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function HowItWorksSection({ className }: HowItWorksSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className={cn("py-24 relative overflow-hidden", className)}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Simple by Design
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Three steps. That&apos;s it.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            No complex setup. No vendor lock-in. Start unifying your workspace in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          <ConnectingPath isVisible={isVisible} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center text-center gap-5",
                  "transition-all duration-700",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                {/* Step circle with icon */}
                <div className={cn(
                  "relative flex items-center justify-center w-16 h-16 rounded-2xl",
                  step.bgColor,
                  "border-2",
                  step.borderColor,
                  step.color,
                  "shadow-xl"
                )}>
                  {step.icon}

                  {/* Step number badge */}
                  <div className={cn(
                    "absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center",
                    "bg-background border-2",
                    step.borderColor,
                    "text-[11px] font-black",
                    step.color
                  )}>
                    {i + 1}
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <div className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", step.color)}>
                    Step {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
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
