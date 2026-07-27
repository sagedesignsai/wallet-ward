import type { Metadata } from "next"
import { PricingSection } from "@/components/marketing/pricing-section"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for every team. Free forever for solo developers. Scale with Pro and Enterprise plans.",
}

const FAQ = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "All paid plans include a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) as well as ACH bank transfers for Enterprise plans.",
  },
  {
    q: "Is my data safe if I downgrade?",
    a: "Absolutely. Your data is never deleted on plan changes. If you exceed the limits of a lower plan, you'll be prompted to upgrade.",
  },
  {
    q: "Do you offer discounts for startups or non-profits?",
    a: "Yes! We offer 50% off Pro plans for qualifying startups and non-profit organizations. Contact us to apply.",
  },
  {
    q: "What does 'zero-knowledge' mean?",
    a: "It means we never see your plaintext secrets. All encryption and decryption happens in your browser before any data is transmitted to our servers.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  "use client"
  return (
    <details className="group overflow-hidden rounded-xl border border-border/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-foreground transition-colors select-none hover:bg-foreground/[0.02]">
        {q}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
        >
          <path
            d="M5 7.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t border-border/30 bg-foreground/[0.01] px-5 pt-1 pb-5 text-sm leading-relaxed text-muted-foreground">
        {a}
      </div>
    </details>
  )
}

export default function PricingPage() {
  return (
    <>
      <div className="pt-16">
        <PricingSection showFullPage />

        {/* FAQ section */}
        <section className="container mx-auto max-w-3xl px-6 py-20">
          <div className="mb-12 space-y-3 text-center">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Can&apos;t find the answer you&apos;re looking for?{" "}
              <a
                href="/contact"
                className="font-medium text-primary hover:underline"
              >
                Chat with our team.
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  )
}
