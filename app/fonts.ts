import localFont from "next/font/local"

export const sans = localFont({
  src: [
    {
      path: "../assets/fonts/Google_Sans_Flex/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
})

export const heading = localFont({
  src: [
    {
      path: "../assets/fonts/Oswald/Oswald-VariableFont_wght.ttf",
      weight: "200 700",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
})

export const mono = localFont({
  src: [
    {
      path: "../assets/fonts/JetBrains_Mono/JetBrainsMono-VariableFont_wght.ttf",
      weight: "100 800",
      style: "normal",
    },
    {
      path: "../assets/fonts/JetBrains_Mono/JetBrainsMono-Italic-VariableFont_wght.ttf",
      weight: "100 800",
      style: "italic",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: "Arial",
})
