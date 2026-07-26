import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Authentication | Flowspace",
  },
  description: "Secure secrets management platform with end-to-end multi-factor encryption",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden select-none">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-md shadow-primary/20">
              F
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Flowspace
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Zero-Trust Encrypted Secrets & Credential Management
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
