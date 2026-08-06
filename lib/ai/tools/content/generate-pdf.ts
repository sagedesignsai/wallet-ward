/**
 * Generate PDF Tool
 *
 * Renders a structured PDF document (proposal, invoice, or report) server-side
 * using react-pdf, uploads the result to project storage, and returns a
 * download URL and a ProjectFile record ID.
 *
 * The agent decides which template to use based on the `documentType` field
 * and populates the matching data schema. The tool validates all required
 * fields at the Zod layer before rendering.
 *
 * Available to: content agent only.
 *
 * Node.js only — set `export const runtime = "nodejs"` in any route that
 * hosts this agent.
 */

import { tool } from "ai"
import { z } from "zod"

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().describe("Line item description"),
  quantity: z.number().positive().describe("Quantity"),
  unitPrice: z.number().nonnegative().describe("Price per unit"),
  total: z.number().nonnegative().describe("quantity × unitPrice"),
})

const tableColumnSchema = z.object({
  header: z.string(),
  key: z.string(),
  align: z.enum(["left", "right"]).optional(),
})

const reportTableSchema = z.object({
  columns: z.array(tableColumnSchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
})

const reportSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
  table: reportTableSchema.optional(),
  highlight: z.string().optional().describe("A callout/highlight box below the body text"),
})

// ─── Template-specific data schemas ──────────────────────────────────────────

const proposalDataSchema = z.object({
  // Branding
  companyName: z.string().describe("Your company name (shown in header)"),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional().describe("Absolute URL to logo image"),

  // Meta
  proposalNumber: z.string().describe("e.g. PROP-2024-001"),
  title: z.string().describe("Proposal headline / project name"),
  date: z.string().describe("Issue date, e.g. 'August 5, 2026'"),
  validUntil: z.string().describe("Expiry date"),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected"]).optional(),
  currency: z.string().length(3).optional().describe("ISO 4217, e.g. USD"),

  // Parties
  fromName: z.string(),
  fromEmail: z.string().email().optional(),
  fromAddress: z.string().optional(),
  toName: z.string().describe("Client contact name"),
  toEmail: z.string().email().optional(),
  toAddress: z.string().optional(),
  toCompany: z.string().optional(),

  // Content
  introduction: z.string().optional().describe("Opening paragraph"),
  scopeItems: z.array(lineItemSchema).min(1),
  terms: z.string().optional(),
  notes: z.string().optional(),

  // Footer
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
})

const invoiceDataSchema = z.object({
  // Branding
  companyName: z.string(),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // Meta
  invoiceNumber: z.string().describe("e.g. INV-2024-042"),
  date: z.string(),
  dueDate: z.string(),
  poNumber: z.string().optional(),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]).optional(),
  currency: z.string().length(3).optional(),

  // Parties
  billerName: z.string(),
  billerEmail: z.string().email().optional(),
  billerAddress: z.string().optional(),
  billerPhone: z.string().optional(),
  billerTaxId: z.string().optional(),
  clientName: z.string(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  clientCompany: z.string().optional(),

  // Line items
  lineItems: z.array(lineItemSchema).min(1),
  taxRate: z.number().nonnegative().max(100).optional().describe("Global tax rate, e.g. 20"),
  taxLabel: z.string().optional().describe("e.g. 'VAT (20%)'"),

  // Payment
  paymentInstructions: z.string().optional(),
  bankDetails: z.string().optional(),
  notes: z.string().optional(),
  thankYouMessage: z.string().optional(),
})

const reportDataSchema = z.object({
  // Branding
  companyName: z.string(),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // Cover
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string(),
  author: z.string().optional(),
  department: z.string().optional(),
  version: z.string().optional().describe("e.g. 'v1.2'"),
  classification: z.string().optional().describe("e.g. 'Confidential'"),

  // Content
  executiveSummary: z.string().optional(),
  sections: z.array(reportSectionSchema).min(1),
  findings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  appendix: z.string().optional(),
})

// ─── Top-level discriminated union ───────────────────────────────────────────

const inputSchema = z.discriminatedUnion("documentType", [
  z.object({
    documentType: z.literal("proposal"),
    projectId: z.string().optional().describe("Project ID; falls back to active project"),
    saveToStorage: z.boolean().optional().default(true).describe("Upload to project storage and return a file record"),
    data: proposalDataSchema,
  }),
  z.object({
    documentType: z.literal("invoice"),
    projectId: z.string().optional(),
    saveToStorage: z.boolean().optional().default(true),
    data: invoiceDataSchema,
  }),
  z.object({
    documentType: z.literal("report"),
    projectId: z.string().optional(),
    saveToStorage: z.boolean().optional().default(true),
    data: reportDataSchema,
  }),
])

// ─── Tool ─────────────────────────────────────────────────────────────────────

export const generatePdfTool = tool({
  description: `Generate a polished PDF document (proposal, invoice, or report) from structured data.
The PDF is rendered server-side using react-pdf and optionally saved to project storage.
Returns the file record ID and a download URL when saveToStorage is true,
or a base64-encoded PDF string when saveToStorage is false.

Use this tool when the user asks to:
- Create / draft / export a proposal, quote, or SOW
- Generate an invoice or bill
- Produce a formal report, analysis, or summary document
- Export any structured content as a downloadable PDF`,

  inputSchema,

  contextSchema: z.object({
    organizationId: z.string(),
    userId: z.string(),
    projectId: z.string().optional(),
  }),

  execute: async (input, { context }) => {
    try {
      const resolvedProjectId = input.projectId ?? context.projectId
      if (!resolvedProjectId && input.saveToStorage !== false) {
        throw new Error(
          "A projectId is required to save the PDF to storage. " +
            "Pass projectId explicitly or set saveToStorage to false."
        )
      }

      // 1. Org-boundary check when saving to storage
      if (resolvedProjectId) {
        const { prisma } = await import("@/lib/db")
        const project = await prisma.project.findFirst({
          where: {
            id: resolvedProjectId,
            organizationId: context.organizationId,
          },
          select: { id: true },
        })
        if (!project) throw new Error("Project not found or access denied")
      }

      // 2. Render the PDF
      const { PdfService } = await import("@/lib/services/pdf-service")
      const pdfInput =
        input.documentType === "proposal"
          ? { type: "proposal" as const, data: input.data }
          : input.documentType === "invoice"
            ? { type: "invoice" as const, data: input.data }
            : { type: "report" as const, data: input.data }

      const { buffer, filename, mimeType } =
        await PdfService.renderWithMeta(pdfInput)

      // 3a. Save to project storage + create ProjectFile record
      if (input.saveToStorage !== false && resolvedProjectId) {
        const { uploadBuffer, buildObjectKey, getPublicUrl } =
          await import("@/lib/storage")
        const { FileService } = await import("@/lib/services/file-service")

        const storageKey = buildObjectKey(resolvedProjectId, filename)
        await uploadBuffer(storageKey, buffer, mimeType)
        const url = getPublicUrl(storageKey) ?? undefined

        const file = await FileService.create({
          projectId: resolvedProjectId,
          name: filename,
          path: "/pdfs",
          type: "document",
          mimeType,
          size: buffer.byteLength,
          storageId: storageKey,
          url,
          tags: ["pdf", input.documentType],
          visibility: "private",
          createdById: context.userId,
        })

        return {
          success: true,
          saved: true,
          fileId: file.id,
          filename: file.name,
          mimeType,
          size: buffer.byteLength,
          url: url ?? null,
          message: `PDF "${filename}" generated and saved to project storage (${Math.round(buffer.byteLength / 1024)} KB).`,
        }
      }

      // 3b. Return base64 for inline use (no storage)
      return {
        success: true,
        saved: false,
        filename,
        mimeType,
        size: buffer.byteLength,
        base64: buffer.toString("base64"),
        message: `PDF "${filename}" generated in memory (${Math.round(buffer.byteLength / 1024)} KB). Use base64 to download.`,
      }
    } catch (error) {
      console.error("[generate-pdf error]", error)
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate PDF. Please check the document data and try again."
      )
    }
  },
})
