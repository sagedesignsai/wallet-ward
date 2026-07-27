"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For solo developers and personal projects.",
    cta: "Get Started Free",
    ctaHref: "/sign-up",
    variant: "outline" as const,
    highlight: false,
    features: [
      "1 Autonomous Agent",
      "Up to 50 encrypted secrets",
      "1 project",
      "7-day audit log retention",
      "Basic 2FA (TOTP)",
      "REST API access",
      "Community support",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5 21c0-3.866 3.134-7 7-7s7 3.134 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Pro",
    monthlyPrice: 19,
    yearlyPrice: 14,
    description: "For growing teams that need full autonomy and control.",
    cta: "Start Pro Trial",
    ctaHref: "/sign-up?plan=pro",
    variant: "default" as const,
    highlight: true,
    badge: "Most Popular",
    features: [
      "5 Autonomous Agents",
      "Unlimited encrypted secrets",
      "Unlimited projects & environments",
      "Daytona Sandbox execution",
      "GitHub, Slack, Vercel integrations",
      "Secret versioning & rollback",
      "90-day audit log retention",
      "API key management",
      "Team access (up to 10 members)",
      "Priority support",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Enterprise",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Unlimited scale, compliance, and custom security.",
    cta: "Contact Sales",
    ctaHref: "/contact",
    variant: "outline" as const,
    highlight: false,
    features: [
      "Unlimited Autonomous Agents",
      "Everything in Pro",
      "Unlimited team members",
      "Custom KMS / HSM key wrapping",
      "SSO / SAML integration",
      "Custom roles & permissions",
      "1-year audit log retention",
      "SIEM log forwarding",
      "SLA guarantee (99.99%)",
      "On-premise deployment option",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M3 21V8l9-6 9 6v13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21v-7h6v7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export function PricingSection({
  className,
  showFullPage,
}: {
  className?: string
  showFullPage?: boolean
}) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className={cn("relative py-24", className)}>
      <div className="container mx-auto px-6">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Start free. Scale your agents.
          </h2>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            No hidden fees. No credit card required for free plan.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !isAnnual ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isAnnual ? "bg-primary" : "bg-border"
              )}
              role="switch"
              aria-checked={isAnnual}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                  isAnnual ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
            <span
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors",
                isAnnual ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Annual
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Save 25%
              </span>
            </span>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
                plan.highlight
                  ? "scale-[1.02] border-primary/50 bg-primary/5 shadow-2xl shadow-primary/10"
                  : "border-border/40 bg-card/50 hover:border-border/70 hover:bg-card/80"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    plan.highlight
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/50 bg-foreground/5 text-foreground"
                  )}
                >
                  {plan.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {plan.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {plan.description}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground tabular-nums">
                    ${isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="mb-1.5 text-sm text-muted-foreground">
                      /mo
                    </span>
                  )}
                </div>
                {isAnnual && plan.yearlyPrice > 0 && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Billed annually (${plan.yearlyPrice * 12}/yr)
                  </div>
                )}
              </div>

              <Button
                asChild
                variant={plan.highlight ? "default" : "outline"}
                className="mb-6 w-full font-semibold"
              >
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>

              <div className="mb-5 border-t border-border/30" />

              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-xs text-muted-foreground"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-px h-4 w-4 shrink-0 text-emerald-400"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeOpacity="0.4"
                      />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-1 text-center text-xs text-muted-foreground">
          <p>
            All plans include 14-day free trial on paid features. Cancel any
            time.
          </p>
          <p>
            Need a custom plan?{" "}
            <Link
              href="/contact"
              className="font-medium text-primary hover:underline"
            >
              Talk to our team
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
