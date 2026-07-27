import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth } from "@/lib/api/auth"
import { prisma as db } from "@/lib/db"
import { z } from "zod"
import { notFound, forbidden } from "@/lib/api/errors"

const prisma = db

// ---------------------------------------------------------------------------
// GET /api/agents/sessions — List agent sessions
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.organizationId) {
      throw forbidden("No active organization")
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId") ?? undefined
    const status = searchParams.get("status") ?? undefined
    const type = searchParams.get("type") ?? undefined
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)

    const where: Record<string, unknown> = {
      project: { organizationId: auth.organizationId },
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (type) where.type = type

    const data = await prisma.agentSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/agents/sessions — Create a new agent session
// ---------------------------------------------------------------------------

const createSessionSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  name: z.string().min(1, "name is required"),
  type: z.enum(["coding", "content", "ops", "research"]).optional(),
  prompt: z.string().optional(),
  metadata: z.unknown().optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.organizationId) {
      throw forbidden("No active organization")
    }

    const body = await request.json()
    const parsed = createSessionSchema.parse(body)

    // Verify the project belongs to the user's organization
    const project = await prisma.project.findFirst({
      where: {
        id: parsed.projectId,
        organizationId: auth.organizationId,
      },
    })

    if (!project) {
      throw notFound("Project not found")
    }

    const data = await prisma.agentSession.create({
      data: {
        projectId: parsed.projectId,
        name: parsed.name,
        type: (parsed.type ?? "coding") as
          "coding" | "content" | "ops" | "research",
        status: "idle",
        prompt: parsed.prompt ?? null,
        metadata: parsed.metadata ?? undefined,
      },
    })

    return json({ data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
