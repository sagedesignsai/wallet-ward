/**
 * POST /api/v1/pdf
 *
 * Generate a PDF document server-side and either:
 *   - stream it back as an `application/pdf` download (default), or
 *   - upload it to project storage and return the file record
 *     when `saveToStorage: true` is passed in the request body.
 *
 * This endpoint is the direct REST counterpart to the `generatePdf` agent
 * tool. Use it from the frontend to let users download PDFs on demand without
 * going through the chat interface.
 *
 * Node.js runtime required — react-pdf uses Node-only APIs.
 */

import { z } from "zod"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, notFound } from "@/lib/api/errors"
import { prisma } from "@/lib/db"
import { PdfService } from "@/lib/services/pdf-service"
import type { PdfInput } from "@/lib/services/pdf-service"

export const runtime = "nodejs"

// ─── Sub-schemas (mirrors generate-pdf.ts tool schemas) ──────────────────────

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
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
  highlight: z.string().optional(),
})

const proposalDataSchema = z.object({
  companyName: z.string(),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional(),
  proposalNumber: z.string(),
  title: z.string(),
  date: z.string(),
  validUntil: z.string(),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected"]).optional(),
  currency: z.string().length(3).optional(),
  fromName: z.string(),
  fromEmail: z.string().email().optional(),
  fromAddress: z.string().optional(),
  toName: z.string(),
  toEmail: z.string().email().optional(),
  toAddress: z.string().optional(),
  toCompany: z.string().optional(),
  introduction: z.string().optional(),
  scopeItems: z.array(lineItemSchema).min(1),
  terms: z.string().optional(),
  notes: z.string().optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
})

const invoiceDataSchema = z.object({
  companyName: z.string(),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional(),
  invoiceNumber: z.string(),
  date: z.string(),
  dueDate: z.string(),
  poNumber: z.string().optional(),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]).optional(),
  currency: z.string().length(3).optional(),
  billerName: z.string(),
  billerEmail: z.string().email().optional(),
  billerAddress: z.string().optional(),
  billerPhone: z.string().optional(),
  billerTaxId: z.string().optional(),
  clientName: z.string(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  clientCompany: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  taxRate: z.number().nonnegative().max(100).optional(),
  taxLabel: z.string().optional(),
  paymentInstructions: z.string().optional(),
  bankDetails: z.string().optional(),
  notes: z.string().optional(),
  thankYouMessage: z.string().optional(),
})

const reportDataSchema = z.object({
  companyName: z.string(),
  companyWebsite: z.string().optional(),
  logoUrl: z.string().url().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string(),
  author: z.string().optional(),
  department: z.string().optional(),
  version: z.string().optional(),
  classification: z.string().optional(),
  executiveSummary: z.string().optional(),
  sections: z.array(reportSectionSchema).min(1),
  findings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  appendix: z.string().optional(),
})

const requestSchema = z.discriminatedUnion("documentType", [
  z.object({
    documentType: z.literal("proposal"),
    projectId: z.string().optional(),
    saveToStorage: z.boolean().optional().default(false),
    data: proposalDataSchema,
  }),
  z.object({
    documentType: z.literal("invoice"),
    projectId: z.string().optional(),
    saveToStorage: z.boolean().optional().default(false),
    data: invoiceDataSchema,
  }),
  z.object({
    documentType: z.literal("report"),
    projectId: z.string().optional(),
    saveToStorage: z.boolean().optional().default(false),
    data: reportDataSchema,
  }),
])

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest("Invalid request body", parsed.error.flatten())
    }

    const input = parsed.data

    // Org-scope the project when provided
    if (input.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: orgCtx.organizationId,
        },
        select: { id: true },
      })
      if (!project) throw notFound("Project not found")
    }

    // Build a typed PdfInput for the service
    const pdfInput: PdfInput =
      input.documentType === "proposal"
        ? { type: "proposal", data: input.data }
        : input.documentType === "invoice"
          ? { type: "invoice", data: input.data }
          : { type: "report", data: input.data }

    const { buffer, filename, mimeType } =
      await PdfService.renderWithMeta(pdfInput)

    // ── Option A: save to storage, return file record ──
    if (input.saveToStorage && input.projectId) {
      requirePermission(orgCtx.memberRole, "project:write")

      const { uploadBuffer, buildObjectKey, getPublicUrl } = await import(
        "@/lib/storage"
      )
      const { FileService } = await import("@/lib/services/file-service")

      const storageKey = buildObjectKey(input.projectId, filename)
      await uploadBuffer(storageKey, buffer, mimeType)
      const url = getPublicUrl(storageKey) ?? undefined

      const file = await FileService.create({
        projectId: input.projectId,
        name: filename,
        path: "/pdfs",
        type: "document",
        mimeType,
        size: buffer.byteLength,
        storageId: storageKey,
        url,
        tags: ["pdf", input.documentType],
        visibility: "private",
        createdById: authCtx.userId,
      })

      return json(
        {
          data: {
            fileId: file.id,
            filename: file.name,
            mimeType,
            size: buffer.byteLength,
            url: url ?? null,
          },
        },
        { status: 201 }
      )
    }

    // ── Option B: stream the PDF directly to the browser ──
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
