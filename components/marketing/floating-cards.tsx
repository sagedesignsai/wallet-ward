"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface FloatingCardsProps {
  className?: string
}

const CARDS = [
  {
    label: "Database Password",
    value: "••••••••••••••",
    tag: "PROD",
    tagColor: "text-red-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <ellipse
          cx="10"
          cy="6"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3 6v4c0 1.657 3.134 3 7 3s7-1.343 7-3V6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3 10v4c0 1.657 3.134 3 7 3s7-1.343 7-3v-4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    delay: "0s",
    y: "float-a",
  },
  {
    label: "Stripe API Key",
    value: "sk_live_••••Xk9p",
    tag: "API",
    tagColor: "text-purple-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <path
          d="M11 3.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M11 10.5L7.5 14l-1.5 2-2-2 1.5-1.5L7 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="12.5" r="0.75" fill="currentColor" />
      </svg>
    ),
    delay: "0.6s",
    y: "float-b",
  },
  {
    label: "SSH Private Key",
    value: "-----BEGIN RSA...",
    tag: "SSH",
    tagColor: "text-green-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <rect
          x="3"
          y="9"
          width="14"
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 9V6a3 3 0 016 0v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    delay: "1.2s",
    y: "float-a",
  },
  {
    label: "JWT Secret",
    value: "eyJhbGc•••••••",
    tag: "AUTH",
    tagColor: "text-amber-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <path
          d="M10 2L3 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6L10 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M7 10l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    delay: "1.8s",
    y: "float-b",
  },
]

export function FloatingCards({ className }: FloatingCardsProps) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-8px) rotate(-1.5deg); }
        }
        .float-a { animation: float-a 6s ease-in-out infinite; }
        .float-b { animation: float-b 7s ease-in-out infinite; }
      `}</style>

      {CARDS.map((card, i) => (
        <div
          key={i}
          className={cn(
            "absolute flex items-center gap-3 rounded-xl px-4 py-3",
            "border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md",
            "dark:border-slate-700/50 dark:bg-slate-900/70",
            card.y
          )}
          style={{
            top: `${[8, 28, 52, 70][i]}%`,
            left: `${[5, 30, 0, 25][i]}%`,
            animationDelay: card.delay,
            width: "clamp(200px, 85%, 280px)",
            zIndex: i + 1,
          }}
        >
          {/* Icon */}
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            {card.icon}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold text-foreground">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex-shrink-0 text-[10px] font-bold",
                  card.tagColor
                )}
              >
                {card.tag}
              </span>
            </div>
            <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {card.value}
            </div>
          </div>

          {/* Status dot */}
          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]">
            <div className="h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          </div>
        </div>
      ))}
    </div>
  )
}
