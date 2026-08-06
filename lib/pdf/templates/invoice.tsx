/**
 * Invoice PDF Template
 *
 * A clean, professional invoice document. Sections:
 *   1. Header band with invoice number + status
 *   2. Biller / Bill-to blocks
 *   3. Invoice meta (date, due date, PO number)
 *   4. Line items table with subtotal, tax, total
 *   5. Payment instructions
 *   6. Notes
 */

import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"
import {
  PageHeader,
  PageFooter,
  Section,
  KeyValue,
  Table,
  TotalsRow,
  Badge,
  Divider,
  BodyText,
  Highlight,
} from "./primitives"
import { COLORS, FONTS, FONT_SIZES, SPACING, PAGE } from "./theme"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate?: number // e.g. 20 for 20%
}

export interface InvoiceData {
  // Branding
  companyName: string
  companyWebsite?: string
  logoUrl?: string

  // Meta
  invoiceNumber: string
  date: string
  dueDate: string
  poNumber?: string
  status?: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled"
  currency?: string

  // Parties
  billerName: string
  billerEmail?: string
  billerAddress?: string
  billerPhone?: string
  billerTaxId?: string

  clientName: string
  clientEmail?: string
  clientAddress?: string
  clientCompany?: string

  // Line items
  lineItems: InvoiceLineItem[]

  // Tax
  taxRate?: number     // global fallback (e.g. 20)
  taxLabel?: string    // e.g. "VAT (20%)"

  // Payment
  paymentInstructions?: string
  bankDetails?: string

  // Footer
  notes?: string
  thankYouMessage?: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: PAGE.headerHeight + SPACING[6],
    paddingBottom: PAGE.footerHeight + SPACING[6],
    paddingHorizontal: PAGE.marginH,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  invoiceTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES["4xl"],
    color: COLORS.primary,
    marginBottom: SPACING[1],
  },
  invoiceNumber: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    marginBottom: SPACING[5],
  },
  partiesRow: {
    flexDirection: "row",
    gap: SPACING[8],
    marginBottom: SPACING[6],
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING[2],
  },
  partyName: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginBottom: 2,
  },
  partyDetail: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: SPACING[8],
    backgroundColor: COLORS.surface,
    padding: SPACING[4],
    borderRadius: 4,
    marginBottom: SPACING[6],
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  totalsBlock: {
    alignSelf: "flex-end",
    width: 220,
    marginTop: SPACING[2],
  },
  subTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING[1],
  },
  subTotalLabel: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  subTotalValue: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING[2],
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    marginTop: SPACING[1],
  },
  grandTotalLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  grandTotalValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.invoice.accent,
  },
  thankYou: {
    marginTop: SPACING[6],
    textAlign: "center",
    fontFamily: FONTS.sansOblique,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

function statusVariant(
  status?: string
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "Paid":
      return "success"
    case "Overdue":
      return "danger"
    case "Sent":
      return "info"
    case "Cancelled":
      return "warning"
    case "Draft":
    default:
      return "default"
  }
}

// ─── Template ─────────────────────────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const currency = data.currency ?? "USD"
  const taxRate = data.taxRate ?? 0
  const taxLabel = data.taxLabel ?? (taxRate ? `Tax (${taxRate}%)` : "Tax")

  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0
  const grandTotal = subtotal + taxAmount

  const columns = [
    { header: "Description", key: "description" },
    { header: "Qty", key: "quantity", align: "right" as const },
    { header: "Unit Price", key: "unitPrice", align: "right" as const },
    { header: "Amount", key: "total", align: "right" as const },
  ]

  const rows = data.lineItems.map((item) => ({
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: fmt(item.unitPrice, currency),
    total: fmt(item.total, currency),
  }))

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author={data.billerName}
      subject="Invoice"
      creator="Flowspace"
      producer="Flowspace / react-pdf"
    >
      <Page size={PAGE.size} style={s.page}>
        {/* ── Fixed header & footer ── */}
        <PageHeader
          title={data.companyName}
          subtitle={`Invoice #${data.invoiceNumber}`}
          logoUrl={data.logoUrl}
          accentColor={COLORS.invoice.header}
        />
        <PageFooter
          companyName={data.companyName}
          website={data.companyWebsite}
        />

        {/* ── Invoice title row ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: SPACING[1] }}>
          <Text style={[s.invoiceTitle, { flex: 1 }]}>INVOICE</Text>
          {data.status && (
            <Badge label={data.status} variant={statusVariant(data.status)} />
          )}
        </View>
        <Text style={s.invoiceNumber}>#{data.invoiceNumber}</Text>

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>From</Text>
            <Text style={s.partyName}>{data.billerName}</Text>
            {data.billerEmail && (
              <Text style={s.partyDetail}>{data.billerEmail}</Text>
            )}
            {data.billerAddress && (
              <Text style={s.partyDetail}>{data.billerAddress}</Text>
            )}
            {data.billerPhone && (
              <Text style={s.partyDetail}>{data.billerPhone}</Text>
            )}
            {data.billerTaxId && (
              <Text style={s.partyDetail}>Tax ID: {data.billerTaxId}</Text>
            )}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Bill To</Text>
            {data.clientCompany && (
              <Text style={s.partyName}>{data.clientCompany}</Text>
            )}
            <Text
              style={data.clientCompany ? s.partyDetail : s.partyName}
            >
              {data.clientName}
            </Text>
            {data.clientEmail && (
              <Text style={s.partyDetail}>{data.clientEmail}</Text>
            )}
            {data.clientAddress && (
              <Text style={s.partyDetail}>{data.clientAddress}</Text>
            )}
          </View>
        </View>

        {/* ── Invoice metadata ── */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Invoice Date</Text>
            <Text style={s.metaValue}>{data.date}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={[s.metaValue, { color: COLORS.warning }]}>
              {data.dueDate}
            </Text>
          </View>
          {data.poNumber && (
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>PO Number</Text>
              <Text style={s.metaValue}>{data.poNumber}</Text>
            </View>
          )}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Currency</Text>
            <Text style={s.metaValue}>{currency}</Text>
          </View>
        </View>

        {/* ── Line items ── */}
        <Section title="Line Items">
          <Table columns={columns} rows={rows} />
        </Section>

        {/* ── Totals ── */}
        <View style={s.totalsBlock}>
          <View style={s.subTotalRow}>
            <Text style={s.subTotalLabel}>Subtotal</Text>
            <Text style={s.subTotalValue}>{fmt(subtotal, currency)}</Text>
          </View>
          {taxRate > 0 && (
            <View style={s.subTotalRow}>
              <Text style={s.subTotalLabel}>{taxLabel}</Text>
              <Text style={s.subTotalValue}>{fmt(taxAmount, currency)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Total Due</Text>
            <Text style={s.grandTotalValue}>{fmt(grandTotal, currency)}</Text>
          </View>
        </View>

        {/* ── Payment instructions ── */}
        {(data.paymentInstructions || data.bankDetails) && (
          <>
            <Divider />
            <Section title="Payment Instructions">
              {data.paymentInstructions && (
                <BodyText>{data.paymentInstructions}</BodyText>
              )}
              {data.bankDetails && (
                <Highlight>{data.bankDetails}</Highlight>
              )}
            </Section>
          </>
        )}

        {/* ── Notes ── */}
        {data.notes && (
          <Section title="Notes">
            <BodyText>{data.notes}</BodyText>
          </Section>
        )}

        {/* ── Thank you ── */}
        {data.thankYouMessage && (
          <Text style={s.thankYou}>{data.thankYouMessage}</Text>
        )}
      </Page>
    </Document>
  )
}
