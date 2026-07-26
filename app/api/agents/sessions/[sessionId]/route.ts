import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth } from "@/lib/api/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notFound, forbidden } from "@/lib/api/errors"

// ---------------------------------------------------------------------------
// GET /api/agents/sessions/:sessionId — Get a single session
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireAuth()
    if (!auth.organizationId) {
      throw forbidden("No active organization")
    }

    const { sessionId } = await params

    const session = await prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        project: { organizationId: auth.organizationId },
      },
    })

    if (!session) {
      throw notFound("Session not found")
    }

    return json({ data: session })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/agents/sessions/:sessionId — Update a session
// ---------------------------------------------------------------------------

const updateSessionSchema = z.object({
  status: z.enum(["idle", "running", "awaiting_approval", "completed", "failed"]).optional(),
  name: z.string().min(1).optional(),
  currentTask: z.string().optional().nullable(),
  daytonaSandboxId: z.string().optional().nullable(),
  sandboxUrl: z.string().optional().nullable(),
  metadata: z.unknown().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireAuth()
    if (!auth.organizationId) {
      throw forbidden("No active organization")
    }

    const { sessionId } = await params

    // Verify ownership
    const existing = await prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        project: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      throw notFound("Session not found")
    }

    const body = await request.json()
    const parsed = updateSessionSchema.parse(body)

    // Strip undefined keys so Prisma only updates provided fields
    const data = await prisma.agentSession.update({
      where: { id: sessionId },
      data: Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => v !== undefined),
      ),
    })

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/agents/sessions/:sessionId — Delete a session
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireAuth()
    if (!auth.organizationId) {
      throw forbidden("No active organization")
    }

    const { sessionId } = await params

    // Verify ownership
    const existing = await prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        project: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      throw notFound("Session not found")
    }

    await prisma.agentSession.delete({
      where: { id: sessionId },
    })

    return json({ data: { success: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
