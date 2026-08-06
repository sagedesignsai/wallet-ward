/**
 * PDF Design System — Shared Tokens
 *
 * All templates import from here so the visual language stays consistent.
 * react-pdf uses pt as the default unit (72 dpi baseline), matching how
 * PDFKit and pdfmake traditionally operate.
 */

// ─── Color palette ────────────────────────────────────────────────────────────

export const COLORS = {
  // Brand
  primary: "#0F172A",     // slate-900 — headings, accents
  accent: "#6366F1",      // indigo-500 — highlights, badges
  accentLight: "#EEF2FF", // indigo-50  — tinted backgrounds

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  text: "#1E293B",        // slate-800  — body text
  muted: "#64748B",       // slate-500  — secondary / labels
  subtle: "#94A3B8",      // slate-400  — placeholders, dividers
  border: "#E2E8F0",      // slate-200  — table lines, card borders
  surface: "#F8FAFC",     // slate-50   — alternating rows, card bg

  // Semantic
  success: "#16A34A",     // green-600
  warning: "#D97706",     // amber-600
  danger: "#DC2626",      // red-600
  info: "#0284C7",        // sky-600

  // Template-specific overrides (can be replaced at call-site)
  proposal: {
    header: "#0F172A",
    accent: "#6366F1",
  },
  invoice: {
    header: "#0F172A",
    accent: "#0284C7",
  },
  report: {
    header: "#0F172A",
    accent: "#16A34A",
  },
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

/**
 * Built-in PDF font families (always available, no network fetch required).
 * For custom fonts add Font.register() calls before renderToBuffer().
 */
export const FONTS = {
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
  sansOblique: "Helvetica-Oblique",
  sansBoldOblique: "Helvetica-BoldOblique",
  mono: "Courier",
  monoBold: "Courier-Bold",
  serif: "Times-Roman",
  serifBold: "Times-Bold",
  serifItalic: "Times-Italic",
  serifBoldItalic: "Times-BoldItalic",
} as const

export const FONT_SIZES = {
  xs: 7,
  sm: 8,
  base: 10,
  md: 11,
  lg: 13,
  xl: 16,
  "2xl": 20,
  "3xl": 26,
  "4xl": 32,
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

/** All values in pt */
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PAGE = {
  size: "A4" as const,
  /** Horizontal margin for the content area */
  marginH: 40,
  /** Vertical margin */
  marginV: 40,
  /** Header band height */
  headerHeight: 72,
  /** Footer band height */
  footerHeight: 28,
} as const
