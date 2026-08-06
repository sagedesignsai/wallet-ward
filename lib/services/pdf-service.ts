/**
 * PDF Service
 *
 * Server-side PDF generation using @react-pdf/renderer's `renderToBuffer`.
 * This module is Node.js only — never import it from client components or
 * edge runtimes. Use `export const runtime = "nodejs"` in any route that
 * calls this service.
 *
 * Supported document types: proposal | invoice | report
 *
 * Usage:
 *   const buffer = await PdfService.render({ type: "invoice", data: { ... } })
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { ProposalDocument, type ProposalData } from "@/lib/pdf/templates/proposal"
import { InvoiceDocument, type InvoiceData } from "@/lib/pdf/templates/invoice"
import { ReportDocument, type ReportData } from "@/lib/pdf/templates/report"

// ─── Public input types ───────────────────────────────────────────────────────

export type PdfInput =
  | { type: "proposal"; data: ProposalData }
  | { type: "invoice"; data: InvoiceData }
  | { type: "report"; data: ReportData }

/** Document types understood by this service. */
export type PdfDocumentType = PdfInput["type"]

// ─── Service ──────────────────────────────────────────────────────────────────

export class PdfService {
  /**
   * Render a document to a Node Buffer.
   *
   * @param input - A discriminated union of { type, data } so TypeScript
   *   enforces that the data shape matches the requested document type.
   * @returns A Buffer containing the rendered PDF bytes.
   */
  static async render(input: PdfInput): Promise<Buffer> {
    const element = PdfService.buildElement(input)
    // renderToBuffer is the Node-only API from @react-pdf/renderer.
    // It accepts a React element whose root is a <Document> and returns
    // a Promise<Buffer>.
    return renderToBuffer(
      element as unknown as Parameters<typeof renderToBuffer>[0]
    ) as Promise<Buffer>
  }

  /**
   * Render and return both the buffer and a pre-computed Content-Disposition
   * filename.
   */
  static async renderWithMeta(
    input: PdfInput
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const buffer = await PdfService.render(input)
    return {
      buffer,
      filename: PdfService.defaultFilename(input),
      mimeType: "application/pdf",
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private static buildElement(input: PdfInput): React.ReactElement {
    switch (input.type) {
      case "proposal":
        return React.createElement(ProposalDocument, { data: input.data })
      case "invoice":
        return React.createElement(InvoiceDocument, { data: input.data })
      case "report":
        return React.createElement(ReportDocument, { data: input.data })
      default: {
        // Exhaustiveness check — TypeScript will flag unknown types at build.
        const _never: never = input
        throw new Error(
          `PdfService: unsupported document type '${(_never as { type: string }).type}'`
        )
      }
    }
  }

  private static defaultFilename(input: PdfInput): string {
    const slug = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    switch (input.type) {
      case "proposal":
        return `proposal-${slug(input.data.proposalNumber)}.pdf`
      case "invoice":
        return `invoice-${slug(input.data.invoiceNumber)}.pdf`
      case "report":
        return `report-${slug(input.data.title)}.pdf`
    }
  }
}
