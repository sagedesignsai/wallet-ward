import { prisma } from "@/lib/db"
import { requireAuth, requireOrganization } from "@/lib/api/auth"
import { toProposalDto } from "@/lib/services/proposals"
import type { ProposalStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

function sseEncode(event: string, data: string, id?: string): string {
  let msg = ""
  if (id) msg += `id: ${id}\n`
  if (event !== "message") msg += `event: ${event}\n`
  msg += `data: ${data}\n\n`
  return msg
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const { organizationId } = await requireOrganization(ctx)
    const { searchParams } = new URL(request.url)

    const statusFilter = searchParams.get("status") as ProposalStatus | null
    const projectId = searchParams.get("projectId")
    const pollInterval = 3000

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const knownStatuses = new Map<string, string>() // proposalId → status
        let eventId = 0
        let pollTimer: ReturnType<typeof setInterval> | null = null
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null
        let closed = false

        function send(event: string, data: string) {
          if (closed) return
          try {
            controller.enqueue(
              encoder.encode(sseEncode(event, data, String(++eventId)))
            )
          } catch {
            // stream closed
          }
        }

        async function poll() {
          if (closed) return
          try {
            const where: Record<string, unknown> = {
              project: { organizationId },
            }
            if (statusFilter) where.status = statusFilter
            if (projectId) where.projectId = projectId

            const proposals = await prisma.actionProposal.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: 50,
            })

            for (const proposal of proposals) {
              const currentStatus = proposal.status
              const prevStatus = knownStatuses.get(proposal.id)
              if (prevStatus && prevStatus !== currentStatus) {
                send(
                  "status_change",
                  JSON.stringify({
                    proposalId: proposal.id,
                    previousStatus: prevStatus,
                    currentStatus,
                    proposal: toProposalDto(proposal),
                  })
                )
              }
              knownStatuses.set(proposal.id, currentStatus)
            }

            // Detect deletions
            for (const [id] of knownStatuses) {
              if (!proposals.find((p) => p.id === id)) {
                send(
                  "status_change",
                  JSON.stringify({ proposalId: id, currentStatus: null })
                )
                knownStatuses.delete(id)
              }
            }
          } catch {
            send(
              "error",
              JSON.stringify({ message: "Failed to poll proposals" })
            )
          }
        }

        // Initial fetch
        await poll()

        // Start polling
        pollTimer = setInterval(poll, pollInterval)

        // Heartbeat every 15s
        heartbeatTimer = setInterval(() => {
          send(
            "heartbeat",
            JSON.stringify({ timestamp: new Date().toISOString() })
          )
        }, 15000)

        // Handle client disconnect via AbortController
        const abortHandler = () => {
          closed = true
          if (pollTimer) clearInterval(pollTimer)
          if (heartbeatTimer) clearInterval(heartbeatTimer)
          try {
            controller.close()
          } catch {}
        }
        if ("signal" in request && request.signal) {
          request.signal.addEventListener("abort", abortHandler)
        }
        // Fallback: detect via polling
        const checkClosed = setInterval(() => {
          if (closed) {
            clearInterval(checkClosed)
            if (pollTimer) clearInterval(pollTimer)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
            try {
              controller.close()
            } catch {}
          }
        }, 2000)

        // Cleanup after 5 minutes to prevent memory leaks
        setTimeout(
          () => {
            closed = true
            if (pollTimer) clearInterval(pollTimer)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
            clearInterval(checkClosed)
            try {
              controller.close()
            } catch {}
          },
          5 * 60 * 1000
        )
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(JSON.stringify({ error: { message } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
