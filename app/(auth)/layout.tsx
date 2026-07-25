import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Wallet Ward",
    default: "Authentication | Wallet Ward",
  },
  description: "Secure authentication for Wallet Ward",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Wallet Ward
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure secrets management platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
