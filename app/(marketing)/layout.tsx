import type { Metadata } from "next"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Flowspace — Autonomous Execution Platform",
  },
  description:
    "Deploy autonomous AI agents that execute multi-step tasks across coding, content, ops, and research — secured by an enterprise-grade credential vault.",
  keywords: [
    "autonomous agents",
    "AI agents",
    "credential vault",
    "DevOps automation",
    "secrets management",
    "zero-leak proxy",
  ],
  openGraph: {
    type: "website",
    siteName: "Flowspace",
    title: "Flowspace — Autonomous Execution Platform",
    description:
      "Autonomous AI agents with zero-leak security. Deploy agents that code, manage ops, and execute tasks independently.",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
