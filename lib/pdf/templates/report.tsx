/**
 * Report PDF Template
 *
 * A structured analytical / business report. Sections:
 *   1. Cover page (title, subtitle, date, author, org)
 *   2. Executive summary
 *   3. Numbered body sections (each with optional table)
 *   4. Key findings / recommendations
 *   5. Appendix (optional)
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
  Table,
  Divider,
  BodyText,
  Highlight,
  KeyValue,
} from "./primitives"
import { COLORS, FONTS, FONT_SIZES, SPACING, PAGE } from "./theme"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportTableData {
  columns: { header: string; key: string; align?: "left" | "right" }[]
  rows: Record<string, string | number | undefined | null>[]
}

export interface ReportSection {
  title: string
  body: string
  table?: ReportTableData
  highlight?: string
}

export interface ReportData {
  // Branding
  companyName: string
  companyWebsite?: string
  logoUrl?: string

  // Cover
  title: string
  subtitle?: string
  date: string
  author?: string
  department?: string
  version?: string
  classification?: string // e.g. "Confidential"

  // Content
  executiveSummary?: string
  sections: ReportSection[]
  findings?: string[]
  recommendations?: string[]
  appendix?: string
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

  // Cover page overrides (first page only via page styles)
  coverPage: {
    paddingTop: 0,
    paddingBottom: PAGE.footerHeight + SPACING[6],
    paddingHorizontal: 0,
    backgroundColor: COLORS.primary,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  coverBand: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingTop: PAGE.headerHeight + SPACING[10],
    paddingHorizontal: PAGE.marginH,
    paddingBottom: SPACING[10],
    justifyContent: "flex-end",
  },
  coverClassification: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: SPACING[4],
  },
  coverTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES["3xl"],
    color: COLORS.white,
    marginBottom: SPACING[3],
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.lg,
    color: COLORS.subtle,
    marginBottom: SPACING[8],
  },
  coverMeta: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: SPACING[4],
    flexDirection: "row",
    gap: SPACING[8],
  },
  coverMetaBlock: {
    flex: 1,
  },
  coverMetaLabel: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.subtle,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  coverMetaValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  coverAccent: {
    height: 4,
    backgroundColor: COLORS.report.accent,
  },

  // Body page
  sectionNumber: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.report.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    marginBottom: SPACING[3],
    paddingBottom: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: SPACING[2],
    gap: SPACING[2],
  },
  listBullet: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.report.accent,
    width: 12,
  },
  listText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    flex: 1,
    lineHeight: 1.5,
  },
  findingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING[3],
    marginTop: SPACING[2],
  },
  findingCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: SPACING[3],
    borderLeftWidth: 3,
    borderLeftColor: COLORS.report.accent,
  },
  findingText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 1.5,
  },
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function CoverPage({ data }: { data: ReportData }) {
  return (
    <Page size={PAGE.size} style={s.coverPage}>
      {/* Thin accent stripe at very top */}
      <View style={s.coverAccent} />

      {/* Dark cover band */}
      <View style={s.coverBand}>
        {data.classification && (
          <Text style={s.coverClassification}>{data.classification}</Text>
        )}
        <Text style={s.coverTitle}>{data.title}</Text>
        {data.subtitle && (
          <Text style={s.coverSubtitle}>{data.subtitle}</Text>
        )}
        <View style={s.coverMeta}>
          <View style={s.coverMetaBlock}>
            <Text style={s.coverMetaLabel}>Date</Text>
            <Text style={s.coverMetaValue}>{data.date}</Text>
          </View>
          {data.author && (
            <View style={s.coverMetaBlock}>
              <Text style={s.coverMetaLabel}>Author</Text>
              <Text style={s.coverMetaValue}>{data.author}</Text>
            </View>
          )}
          {data.department && (
            <View style={s.coverMetaBlock}>
              <Text style={s.coverMetaLabel}>Department</Text>
              <Text style={s.coverMetaValue}>{data.department}</Text>
            </View>
          )}
          {data.version && (
            <View style={s.coverMetaBlock}>
              <Text style={s.coverMetaLabel}>Version</Text>
              <Text style={s.coverMetaValue}>{data.version}</Text>
            </View>
          )}
          <View style={s.coverMetaBlock}>
            <Text style={s.coverMetaLabel}>Prepared by</Text>
            <Text style={s.coverMetaValue}>{data.companyName}</Text>
          </View>
        </View>
      </View>

      <PageFooter
        companyName={data.companyName}
        website={data.companyWebsite}
      />
    </Page>
  )
}

function BodyPage({
  data,
  children,
}: {
  data: ReportData
  children: React.ReactNode
}) {
  return (
    <Page size={PAGE.size} style={s.page}>
      <PageHeader
        title={data.title}
        subtitle={data.date}
        logoUrl={data.logoUrl}
        accentColor={COLORS.report.header}
      />
      <PageFooter
        companyName={data.companyName}
        website={data.companyWebsite}
      />
      {children}
    </Page>
  )
}

// ─── Template ─────────────────────────────────────────────────────────────────

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document
      title={data.title}
      author={data.author ?? data.companyName}
      subject={data.subtitle ?? "Report"}
      creator="Flowspace"
      producer="Flowspace / react-pdf"
    >
      {/* ── Cover page ── */}
      <CoverPage data={data} />

      {/* ── Content pages ── */}
      <BodyPage data={data}>
        {/* Executive summary */}
        {data.executiveSummary && (
          <Section title="Executive Summary">
            <Highlight accentColor={COLORS.report.accent}>
              {data.executiveSummary}
            </Highlight>
          </Section>
        )}

        {/* Body sections */}
        {data.sections.map((section, idx) => (
          <Section key={idx}>
            <Text style={s.sectionNumber}>
              Section {String(idx + 1).padStart(2, "0")}
            </Text>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <BodyText>{section.body}</BodyText>
            {section.table && (
              <Table
                columns={section.table.columns}
                rows={section.table.rows}
              />
            )}
            {section.highlight && (
              <Highlight accentColor={COLORS.report.accent}>
                {section.highlight}
              </Highlight>
            )}
          </Section>
        ))}

        {/* Key findings */}
        {data.findings && data.findings.length > 0 && (
          <Section title="Key Findings">
            <View style={s.findingsGrid}>
              {data.findings.map((finding, idx) => (
                <View key={idx} style={s.findingCard}>
                  <Text style={s.findingText}>{finding}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Section title="Recommendations">
            {data.recommendations.map((rec, idx) => (
              <View key={idx} style={s.listItem}>
                <Text style={s.listBullet}>{idx + 1}.</Text>
                <Text style={s.listText}>{rec}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Appendix */}
        {data.appendix && (
          <>
            <Divider />
            <Section title="Appendix">
              <BodyText>{data.appendix}</BodyText>
            </Section>
          </>
        )}
      </BodyPage>
    </Document>
  )
}
