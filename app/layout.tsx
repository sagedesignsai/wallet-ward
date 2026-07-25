import "./globals.css"
import { sans, heading, mono } from "./fonts"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from "nextjs-toploader"
import { cn } from "@/lib/utils"
import { AppwritePing } from "@/components/appwrite-ping"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        sans.variable,
        heading.variable,
        mono.variable,
        "antialiased",
        "font-sans"
      )}
    >
      <body>
        <NextTopLoader showSpinner={false} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
