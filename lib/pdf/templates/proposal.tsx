/**
 * Proposal PDF Template
 *
 * A polished business proposal document. Sections:
 *   1. Cover header with branding + status badge
 *   2. Parties block (From / To)
 *   3. Executive summary / introduction
 *   4. Scope of work — line items
 *   5. Pricing summary
 *   6. Terms and validity
 *   7. Signature area
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

export interface ProposalLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ProposalData {
  // Branding
  companyName: string
  companyWebsite?: string
  logoUrl?: string

  // Meta
  proposalNumber: string
  title: string
  date: string
  validUntil: string
  status?: "Draft" | "Sent" | "Accepted" | "Rejected"
  currency?: string

  // Parties
  fromName: string
  fromEmail?: string
  fromAddress?: string

  toName: string
  toEmail?: string
  toAddress?: string
  toCompany?: string

  // Content
  introduction?: string
  scopeItems: ProposalLineItem[]
  terms?: string
  notes?: string

  // Footer note / signature
  signatoryName?: string
  signatoryTitle?: string
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
  coverBand: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 4,
    padding: SPACING[5],
    marginBottom: SPACING[6],
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  coverTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES["3xl"],
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING[4],
  },
  coverMeta: {
    alignItems: "flex-end",
    gap: SPACING[1],
  },
  coverMetaLine: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
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
  signatureRow: {
    flexDirection: "row",
    gap: SPACING[8],
    marginTop: SPACING[6],
  },
  signatureBlock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING[2],
  },
  signatureLabel: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
  },
  signatureName: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

function statusVariant(
  status?: string
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "Accepted":
      return "success"
    case "Rejected":
      return "danger"
    case "Sent":
      return "info"
    case "Draft":
    default:
      return "default"
  }
}

// ─── Template ─────────────────────────────────────────────────────────────────

export function ProposalDocument({ data }: { data: ProposalData }) {
  const currency = data.currency ?? "USD"
  const subtotal = data.scopeItems.reduce((sum, item) => sum + item.total, 0)

  const tableColumns = [
    { header: "Description", key: "description" },
    { header: "Qty", key: "quantity", align: "right" as const },
    { header: "Unit Price", key: "unitPrice", align: "right" as const },
    { header: "Total", key: "total", align: "right" as const },
  ]

  const tableRows = data.scopeItems.map((item) => ({
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: formatCurrency(item.unitPrice, currency),
    total: formatCurrency(item.total, currency),
  }))

  return (
    <Document
      title={`Proposal — ${data.title}`}
      author={data.fromName}
      subject="Business Proposal"
      creator="Flowspace"
      producer="Flowspace / react-pdf"
    >
      <Page size={PAGE.size} style={s.page}>
        {/* ── Fixed header & footer ── */}
        <PageHeader
          title={data.companyName}
          subtitle={`Proposal #${data.proposalNumber}`}
          logoUrl={data.logoUrl}
          accentColor={COLORS.proposal.header}
        />
        <PageFooter
          companyName={data.companyName}
          website={data.companyWebsite}
        />

        {/* ── Cover band ── */}
        <View style={s.coverBand}>
          <Text style={s.coverTitle}>{data.title}</Text>
          <View style={s.coverMeta}>
            {data.status && (
              <Badge label={data.status} variant={statusVariant(data.status)} />
            )}
            <Text style={s.coverMetaLine}>Date: {data.date}</Text>
            <Text style={s.coverMetaLine}>
              Valid until: {data.validUntil}
            </Text>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>From</Text>
            <Text style={s.partyName}>{data.fromName}</Text>
            {data.fromEmail && (
              <Text style={s.partyDetail}>{data.fromEmail}</Text>
            )}
            {data.fromAddress && (
              <Text style={s.partyDetail}>{data.fromAddress}</Text>
            )}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Prepared For</Text>
            {data.toCompany && (
              <Text style={s.partyName}>{data.toCompany}</Text>
            )}
            <Text
              style={data.toCompany ? s.partyDetail : s.partyName}
            >
              {data.toName}
            </Text>
            {data.toEmail && (
              <Text style={s.partyDetail}>{data.toEmail}</Text>
            )}
            {data.toAddress && (
              <Text style={s.partyDetail}>{data.toAddress}</Text>
            )}
          </View>
        </View>

        {/* ── Introduction ── */}
        {data.introduction && (
          <Section title="Introduction">
            <BodyText>{data.introduction}</BodyText>
          </Section>
        )}

        {/* ── Scope of work ── */}
        <Section title="Scope of Work">
          <Table columns={tableColumns} rows={tableRows} />
          <TotalsRow
            label="Total"
            value={formatCurrency(subtotal, currency)}
          />
        </Section>

        {/* ── Terms ── */}
        {data.terms && (
          <Section title="Terms &amp; Conditions">
            <BodyText>{data.terms}</BodyText>
          </Section>
        )}

        {/* ── Notes ── */}
        {data.notes && (
          <Section title="Notes">
            <Highlight>{data.notes}</Highlight>
          </Section>
        )}

        {/* ── Signature ── */}
        <View style={s.signatureRow}>
          <View style={s.signatureBlock}>
            <Text style={s.signatureLabel}>Prepared by</Text>
            <Text style={s.signatureName}>
              {data.signatoryName ?? data.fromName}
            </Text>
            {data.signatoryTitle && (
              <Text style={s.signatureLabel}>{data.signatoryTitle}</Text>
            )}
          </View>
          <View style={s.signatureBlock}>
            <Text style={s.signatureLabel}>Client signature</Text>
            <Text style={s.signatureName}>{data.toName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
