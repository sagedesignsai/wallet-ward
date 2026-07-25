"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WorkspaceHeroVisual } from "@/components/marketing/workspace-hero-visual"

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
      {/* Background radial gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-cyan-500/6 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_2s_infinite]" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl animate-[pulse_7s_ease-in-out_1s_infinite]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-4rem)] py-16">

          {/* LEFT: Text content */}
          <div className="flex flex-col gap-7 max-w-xl">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-semibold text-primary tracking-wide">
                Remote Work Platform
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
                Your Workspace.
                <br />
                One Place.
              </h1>
              <div className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-[pulse_4s_ease-in-out_infinite]">
                  Everything Connected.
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p className="text-muted-foreground text-base leading-relaxed">
              Projects, documents, tasks, and secrets — unified in one workspace.
              Connect your existing tools like GitHub, Linear, Vercel, and Slack without replacing a thing.
            </p>

            {/* Trust badges inline */}
            <div className="flex flex-wrap gap-3">
              {["GitHub Integration", "Real-time Collaboration", "API-First", "Team Workspaces"].map((badge) => (
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
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 10h8M6 7h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  View Features
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-1">
              {/* Avatars */}
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
                <span className="font-semibold text-foreground">1,200+</span> teams building on Nimbus
              </p>
            </div>
          </div>

          {/* RIGHT: Workspace Visual */}
          <div className="relative hidden lg:flex items-center justify-center h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <WorkspaceHeroVisual />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade-out for smooth section transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
