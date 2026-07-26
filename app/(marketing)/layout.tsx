import type { Metadata } from "next"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Flowspace — Zero-Knowledge Secrets Management",
  },
  description:
    "Encrypt, organize, and share credentials across your team with military-grade AES-256 security and a zero-knowledge architecture.",
  keywords: ["secrets management", "credential vault", "API keys", "encryption", "security", "2FA"],
  openGraph: {
    type: "website",
    siteName: "Flowspace",
    title: "Flowspace — Zero-Knowledge Secrets Management",
    description:
      "Military-grade AES-256 encryption. Zero-knowledge architecture. Store and share your secrets with absolute confidence.",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
