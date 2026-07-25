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
    <section className={cn("relative py-28 overflow-hidden", className)}>
      {/* Animated border glow container */}
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="relative rounded-3xl p-px overflow-hidden">
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
          <div className="relative rounded-3xl bg-background dark:bg-card p-12 text-center space-y-6">
            {/* Background radial glow */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Shield icon SVG */}
            <div className="relative flex justify-center">
              <div className="w-16 h-16 relative">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <path
                    d="M32 6L8 18v18c0 15 10 24 24 26 14-2 24-11 24-26V18L32 6z"
                    fill="oklch(0.6 0.18 242)"
                    fillOpacity="0.15"
                    stroke="oklch(0.6 0.18 242)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 32l7 7 13-13"
                    stroke="oklch(0.75 0.15 240)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="30"
                    strokeDashoffset="30"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="30;0"
                      dur="0.8s"
                      fill="freeze"
                      begin="0.5s"
                    />
                  </path>
                  {/* Pulse ring */}
                  <circle cx="32" cy="32" r="28" stroke="oklch(0.6 0.18 242)" strokeWidth="1" strokeOpacity="0">
                    <animate attributeName="r" values="26;38;38" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0;0.3;0" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
                Start protecting your secrets{" "}
                <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                  today.
                </span>
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                Join thousands of developers who trust Nimbus with their most sensitive credentials.
                Free forever. No credit card needed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="font-semibold w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
                <Link href="/sign-up">
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Create Free Account
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold w-full sm:w-auto gap-2">
                <Link href="/pricing">
                  View Pricing Plans
                </Link>
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              No credit card required · GDPR compliant · Open-source core
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
