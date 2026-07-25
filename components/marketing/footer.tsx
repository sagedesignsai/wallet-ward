import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "SDKs", href: "/docs/sdks" },
    { label: "Status", href: "/status" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">
                N
              </div>
              <span className="font-bold text-sm text-foreground">Nimbus</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Zero-knowledge secrets management for security-first teams.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              {[
                {
                  label: "GitHub",
                  icon: (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  ),
                },
                {
                  label: "X / Twitter",
                  icon: (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M11.617 8.89L17.747 2h-1.455l-5.33 6.2L6.625 2H2l6.43 9.356L2 18.5h1.455l5.622-6.54 4.43 6.54H18L11.617 8.89zm-1.99 2.317l-.651-.932L3.43 3.082h2.23l4.182 5.981.651.93 5.433 7.769h-2.23l-4.068-5.82z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-foreground/5 transition-all duration-150"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">{group}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nimbus. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
