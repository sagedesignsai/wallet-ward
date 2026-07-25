"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { VaultAnimation } from "@/components/marketing/vault-animation"
import { FloatingCards } from "@/components/marketing/floating-cards"
import { SecurityGrid } from "@/components/marketing/security-grid"

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
      {/* Animated background grid */}
      <SecurityGrid />

      {/* Background radial gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-cyan-500/6 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_2s_infinite]" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-[pulse_7s_ease-in-out_1s_infinite]" />
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
                Enterprise-grade security
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
                Your Secrets.
                <br />
                Your Control.
              </h1>
              <div className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-[pulse_4s_ease-in-out_infinite]">
                  Zero Compromise.
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p className="text-muted-foreground text-base leading-relaxed">
              Encrypt, organize, and share credentials across your team with military-grade
              AES-256 security and a zero-knowledge architecture. Nothing leaves your device unencrypted.
            </p>

            {/* Trust badges inline */}
            <div className="flex flex-wrap gap-3">
              {["AES-256", "Zero-Knowledge", "SOC 2 Ready", "Open Source"].map((badge) => (
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
                  Start Free — No Card Required
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
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 7.5L13 10 8 12.5V7.5z" fill="currentColor" />
                  </svg>
                  View Demo
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
                <span className="font-semibold text-foreground">1,200+</span> developers already using Wallet Ward
              </p>
            </div>
          </div>

          {/* RIGHT: Visual */}
          <div className="relative hidden lg:flex items-center justify-center h-[500px]">
            {/* Vault animation (back) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <VaultAnimation />
            </div>

            {/* Floating credential cards (front layer) */}
            <div className="absolute inset-0">
              <FloatingCards />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade-out for smooth section transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
