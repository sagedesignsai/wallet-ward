import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/hero-section"
import { StatsSection } from "@/components/marketing/stats-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works"
import { PricingSection } from "@/components/marketing/pricing-section"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Nimbus — Remote Workspace Platform",
  description:
    "Unify projects, documents, tasks, and secrets in one workspace. Connect GitHub, Linear, Vercel, and Slack without replacing your tools. Start free.",
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
