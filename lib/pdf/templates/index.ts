/**
 * PDF Templates — barrel export
 *
 * Import document components and their data types from here.
 */

export { ProposalDocument } from "./proposal"
export type { ProposalData, ProposalLineItem } from "./proposal"

export { InvoiceDocument } from "./invoice"
export type { InvoiceData, InvoiceLineItem } from "./invoice"

export { ReportDocument } from "./report"
export type { ReportData, ReportSection, ReportTableData } from "./report"

// Design tokens — re-export for convenience
export { COLORS, FONTS, FONT_SIZES, SPACING, PAGE } from "./theme"
