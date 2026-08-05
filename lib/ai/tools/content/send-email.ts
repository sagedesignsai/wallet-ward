import { tool } from "ai"
import { z } from "zod"

/**
 * Send Email Tool
 *
 * Sends an email via Gmail integration. Requires a Gmail integration
 * to be connected to the project.
 */
export const sendEmailTool = tool({
  description:
    "Send an email via Gmail integration. The project must have a Gmail integration connected. Supports plain text and HTML emails with optional CC and BCC recipients.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    to: z.array(z.string().email()).min(1).describe("Array of recipient email addresses"),
    subject: z.string().min(1).describe("Email subject line"),
    body: z.string().min(1).describe("Plain text email body"),
    html: z.string().optional().describe("Optional HTML email body (overrides plain text if provided)"),
    cc: z.array(z.string().email()).optional().describe("Optional CC recipients"),
    bcc: z.array(z.string().email()).optional().describe("Optional BCC recipients"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async (input, { context }) => {
    const resolvedProjectId = input.projectId ?? context.projectId
    try {
      const { prisma } = await import("@/lib/db")
      const { getDecryptedToken, refreshTokenIfNeeded } = await import(
        "@/lib/services/integrations"
      )

      // Find the Gmail integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: resolvedProjectId,
          provider: "gmail",
          enabled: true,
          project: {
            organizationId: context.organizationId,
          },
        },
        include: {
          project: { select: { organizationId: true } },
        },
      })

      if (!integration) {
        return {
          error: true,
          message: "No Gmail integration found for this project. Connect Gmail in Integrations first.",
        }
      }

      // Refresh token if needed
      await refreshTokenIfNeeded(integration.id, context.organizationId)

      // Decrypt the access token server-side
      const token = await getDecryptedToken(integration, "access")

      // Build email message in RFC 2822 format
      const headers = [
        `To: ${input.to.join(", ")}`,
        `Subject: ${input.subject}`,
      ]

      if (input.cc && input.cc.length > 0) {
        headers.push(`Cc: ${input.cc.join(", ")}`)
      }

      if (input.bcc && input.bcc.length > 0) {
        headers.push(`Bcc: ${input.bcc.join(", ")}`)
      }

      headers.push("MIME-Version: 1.0")

      let emailBody: string

      if (input.html) {
        // Multipart email with both plain text and HTML
        const boundary = `boundary_${Date.now()}`
        headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
        
        emailBody = [
          ...headers,
          "",
          `--${boundary}`,
          "Content-Type: text/plain; charset=UTF-8",
          "",
          input.body,
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=UTF-8",
          "",
          input.html,
          "",
          `--${boundary}--`,
        ].join("\r\n")
      } else {
        // Plain text only
        headers.push("Content-Type: text/plain; charset=UTF-8")
        emailBody = [...headers, "", input.body].join("\r\n")
      }

      // Encode to base64url
      const encodedMessage = Buffer.from(emailBody)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

      // Send via Gmail API
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: encodedMessage,
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return {
          error: true,
          message: `Failed to send email: ${res.status} ${res.statusText}`,
          details: errorData,
        }
      }

      const responseData = await res.json()

      return {
        success: true,
        message: "Email sent successfully",
        data: {
          messageId: responseData.id,
          threadId: responseData.threadId,
          to: input.to,
          subject: input.subject,
        },
      }
    } catch (error) {
      console.error("[send-email error]", error)
      return {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send email",
      }
    }
  },
})
