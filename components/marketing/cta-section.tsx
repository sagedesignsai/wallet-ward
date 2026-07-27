"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CtaSectionProps {
  className?: string
}

export function CtaSection({ className }: CtaSectionProps) {
  return (
    <section className={cn("relative overflow-hidden py-28", className)}>
      {/* Animated border glow container */}
      <div className="container mx-auto max-w-3xl px-6">
        <div className="relative overflow-hidden rounded-3xl p-px">
          {/* Rotating conic gradient border */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                "conic-gradient(from 0deg, oklch(0.6 0.18 242) 0deg, oklch(0.5 0.15 210) 90deg, transparent 180deg, oklch(0.6 0.18 242) 360deg)",
              animation: "spin 6s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>

          {/* Inner card */}
          <div className="relative space-y-6 rounded-3xl bg-background p-12 text-center dark:bg-card">
            {/* Background radial glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Workspace icon */}
            <div className="relative flex justify-center">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 64 64" fill="none" className="h-16 w-16">
                  {/* Dashboard shape */}
                  <rect
                    x="10"
                    y="14"
                    width="44"
                    height="32"
                    rx="6"
                    fill="oklch(0.6 0.18 242)"
                    fillOpacity="0.15"
                    stroke="oklch(0.6 0.18 242)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Internal grid lines */}
                  <line
                    x1="10"
                    y1="24"
                    x2="54"
                    y2="24"
                    stroke="oklch(0.6 0.18 242)"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                  />
                  <line
                    x1="32"
                    y1="24"
                    x2="32"
                    y2="46"
                    stroke="oklch(0.6 0.18 242)"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                  />
                  {/* Window dots */}
                  <circle cx="18" cy="19" r="2" fill="#ff5f57" opacity="0.8" />
                  <circle cx="25" cy="19" r="2" fill="#febc2e" opacity="0.8" />
                  <circle cx="32" cy="19" r="2" fill="#28c840" opacity="0.8" />
                  {/* Connected indicator */}
                  <circle
                    cx="48"
                    cy="19"
                    r="3"
                    fill="oklch(0.7 0.15 150)"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.5;1;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Pulse ring */}
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="oklch(0.6 0.18 242)"
                    strokeWidth="1"
                    strokeOpacity="0"
                  >
                    <animate
                      attributeName="r"
                      values="24;36;36"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0;0.3;0"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl leading-tight font-black text-foreground sm:text-4xl">
                Start unifying your workspace{" "}
                <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                  today.
                </span>
              </h2>
              <p className="mx-auto max-w-md text-base text-muted-foreground">
                Join thousands of teams who use Flowspace to bring projects,
                docs, tasks, and integrations into one place. Free forever. No
                credit card needed.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full gap-2 font-semibold shadow-lg shadow-primary/20 sm:w-auto"
              >
                <Link href="/sign-up">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path
                      d="M10 4v12M4 10h12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Create Free Account
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full gap-2 font-semibold sm:w-auto"
              >
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              No credit card required · GDPR compliant · SOC 2 Ready
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
