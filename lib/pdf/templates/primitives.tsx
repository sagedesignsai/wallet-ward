/**
 * PDF Layout Primitives
 *
 * Reusable react-pdf components shared across all document templates.
 * Every component is a pure function — no state, no effects.
 *
 * Import these in template files, never from outside lib/pdf/.
 */

import React from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  Link,
} from "@react-pdf/renderer"
import { COLORS, FONTS, FONT_SIZES, SPACING, PAGE } from "./theme"

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Page Header ──
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PAGE.headerHeight,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAGE.marginH,
  },
  pageHeaderTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES["2xl"],
    color: COLORS.white,
    flex: 1,
  },
  pageHeaderMeta: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.subtle,
    textAlign: "right",
  },
  pageHeaderLogo: {
    width: 32,
    height: 32,
    marginRight: SPACING[3],
  },

  // ── Page Footer ──
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PAGE.footerHeight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAGE.marginH,
  },
  pageFooterLeft: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.subtle,
  },
  pageFooterRight: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.subtle,
  },

  // ── Section ──
  sectionWrapper: {
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    paddingBottom: SPACING[1],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // ── Key-value grid ──
  kvRow: {
    flexDirection: "row",
    marginBottom: SPACING[1],
  },
  kvLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    width: 120,
  },
  kvValue: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },

  // ── Table ──
  table: {
    width: "100%",
    marginBottom: SPACING[4],
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
  },
  tableHeaderCell: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.surface,
  },
  tableCell: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  tableCellRight: {
    textAlign: "right",
  },

  // ── Totals row ──
  totalsRow: {
    flexDirection: "row",
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    marginTop: SPACING[1],
  },
  totalsLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    flex: 1,
  },
  totalsValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    textAlign: "right",
  },

  // ── Badge / status pill ──
  badge: {
    borderRadius: 4,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Divider ──
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginVertical: SPACING[4],
  },

  // ── Body text ──
  bodyText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    lineHeight: 1.6,
    marginBottom: SPACING[2],
  },

  // ── Highlight box ──
  highlight: {
    backgroundColor: COLORS.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: SPACING[3],
    marginBottom: SPACING[4],
    borderRadius: 2,
  },
  highlightText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    lineHeight: 1.5,
  },
})

// ─── Components ───────────────────────────────────────────────────────────────

/** Full-bleed page header band. Pass `fixed` on the parent <Page> or set fixed={true}. */
export function PageHeader({
  title,
  subtitle,
  logoUrl,
  accentColor = COLORS.primary,
}: {
  title: string
  subtitle?: string
  logoUrl?: string
  accentColor?: string
}) {
  return (
    <View
      fixed
      style={[s.pageHeader, { backgroundColor: accentColor }]}
    >
      {logoUrl && (
        <Image src={logoUrl} style={s.pageHeaderLogo} cache />
      )}
      <Text style={s.pageHeaderTitle}>{title}</Text>
      {subtitle && (
        <Text style={s.pageHeaderMeta}>{subtitle}</Text>
      )}
    </View>
  )
}

/** Sticky footer with company info on the left and page numbers on the right. */
export function PageFooter({
  companyName,
  website,
}: {
  companyName?: string
  website?: string
}) {
  return (
    <View fixed style={s.pageFooter}>
      <Text style={s.pageFooterLeft}>
        {companyName}
        {website ? ` · ${website}` : ""}
      </Text>
      <Text
        style={s.pageFooterRight}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

/** Named section with a bold title and a subtle bottom border. */
export function Section({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <View style={s.sectionWrapper}>
      {title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  )
}

/** Horizontal key → value row for metadata blocks. */
export function KeyValue({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value ?? "—"}</Text>
    </View>
  )
}

/** Generic two-dimensional table. */
export function Table({
  columns,
  rows,
}: {
  columns: { header: string; key: string; align?: "left" | "right" }[]
  rows: Record<string, string | number | undefined | null>[]
}) {
  return (
    <View style={s.table}>
      {/* Header */}
      <View style={s.tableHeaderRow}>
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[
              s.tableHeaderCell,
              col.align === "right" ? s.tableCellRight : {},
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {/* Body */}
      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={[s.tableRow, rowIdx % 2 === 1 ? s.tableRowAlt : {}]}
        >
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                s.tableCell,
                col.align === "right" ? s.tableCellRight : {},
              ]}
            >
              {row[col.key] != null ? String(row[col.key]) : "—"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

/** Totals / grand total row rendered below a table. */
export function TotalsRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <View style={s.totalsRow}>
      <Text style={s.totalsLabel}>{label}</Text>
      <Text style={s.totalsValue}>{value}</Text>
    </View>
  )
}

/** Coloured status badge (success / warning / danger / info / default). */
export function Badge({
  label,
  variant = "default",
}: {
  label: string
  variant?: "success" | "warning" | "danger" | "info" | "default"
}) {
  const bg: Record<string, string> = {
    success: COLORS.success,
    warning: COLORS.warning,
    danger: COLORS.danger,
    info: COLORS.info,
    default: COLORS.muted,
  }
  return (
    <View style={[s.badge, { backgroundColor: bg[variant] ?? COLORS.muted }]}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  )
}

/** Horizontal rule. */
export function Divider() {
  return <View style={s.divider} />
}

/** Standard body paragraph. */
export function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={s.bodyText}>{children}</Text>
}

/** Left-bordered highlight / callout box. */
export function Highlight({
  children,
  accentColor = COLORS.accent,
}: {
  children: React.ReactNode
  accentColor?: string
}) {
  return (
    <View style={[s.highlight, { borderLeftColor: accentColor }]}>
      <Text style={s.highlightText}>{children}</Text>
    </View>
  )
}

/** Inline hyperlink for use inside <Text>. */
export function InlineLink({
  href,
  children,
}: {
  href: string
  children: string
}) {
  return (
    <Link
      src={href}
      style={{ color: COLORS.accent, textDecoration: "underline" }}
    >
      {children}
    </Link>
  )
}
