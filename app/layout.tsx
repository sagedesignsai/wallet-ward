import "./globals.css"
import { sans, heading, mono } from "./fonts"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from "nextjs-toploader"
import { cn } from "@/lib/utils"

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
        "font-sans",
        "h-full"
      )}
    >
      <body className="h-full">
        <NextTopLoader showSpinner={false} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
