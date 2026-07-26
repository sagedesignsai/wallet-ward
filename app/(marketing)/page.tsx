import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/hero-section"
import { StatsSection } from "@/components/marketing/stats-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works"
import { PricingSection } from "@/components/marketing/pricing-section"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Flowspace — Autonomous Execution & Security Hub",
  description:
    "Deploy autonomous AI agents secured by an enterprise-grade credential vault. Augment your existing tools like GitHub, Slack, Vercel, and Daytona without replacing your workflow.",
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />
    </>
  )
}
