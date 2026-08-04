import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, conflict, notFound } from "@/lib/api/errors"
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

type Ctx = { params: Promise<{ projectId: string }> }

const DESKTOP_NAME = "default"

/**
 * Server-side allowlist of valid desktop app ids. Mirrors the app registry in
 * lib/desktop/system-apps.ts (client components can't be imported server-side).
 */
const ALLOWED_APP_IDS = new Set([
  "code-editor",
  "document-editor",
  "image-viewer",
  "file-manager",
  "terminal",
  "artifact",
  "task",
  "secret",
  "preview",
  "desktop",
  "web-terminal",
])

/**
 * Content fields that must never be persisted to desktop_state. Windows carry
 * only geometry/state/appId/title plus resource references — never raw content
 * or signed URLs (they are re-resolved client-side via app onRefresh).
 */
const STRIPPED_FIELDS = new Set(["url", "token", "body", "code", "html", "lines"])

function sanitizeWindows(windows: unknown[]): Prisma.InputJsonValue {
  const sanitized = windows.map((w) => {
    if (!w || typeof w !== "object") return w
    const win = w as Record<string, unknown>
    const content = win.content
    if (content && typeof content === "object") {
      const clean: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(content)) {
        if (!STRIPPED_FIELDS.has(key)) clean[key] = value
      }
      win.content = clean
    }
    return win
  })
  return sanitized as Prisma.InputJsonValue
}

function desktopStateKey(projectId: string, userId: string) {
  return {
    projectId_userId_name: {
      projectId,
      userId,
      name: DESKTOP_NAME,
    },
  }
}

async function assertProjectInOrg(projectId: string, organizationId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw notFound("Project not found")
}

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:projectId/desktop — Load persisted desktop state
// ---------------------------------------------------------------------------

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")
    await assertProjectInOrg(projectId, orgCtx.organizationId)

    const state = await db.desktopState.findUnique({
      where: desktopStateKey(projectId, authCtx.userId),
    })

    return json({
      data: state
        ? {
            windows: state.windows,
            desktop: state.desktop,
            version: state.version,
            updatedAt: state.updatedAt,
          }
        : { windows: [], desktop: {}, version: 1, updatedAt: null },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ---------------------------------------------------------------------------
// PUT /api/v1/projects/:projectId/desktop — Upsert persisted desktop state
// ---------------------------------------------------------------------------

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")
    await assertProjectInOrg(projectId, orgCtx.organizationId)

    const body = await request.json()
    const windows = body.windows
    const desktop = body.desktop ?? {}
    const clientVersion = body.version

    if (!Array.isArray(windows)) {
      throw badRequest("'windows' must be an array")
    }
    if (!desktop || typeof desktop !== "object") {
      throw badRequest("'desktop' must be an object")
    }

    const hasUnknownApp = windows.some(
      (w) =>
        !w ||
        typeof w !== "object" ||
        !ALLOWED_APP_IDS.has((w as { appId?: string }).appId ?? "")
    )
    if (hasUnknownApp) {
      throw badRequest("'windows' contains an unknown appId")
    }

    const sanitizedWindows = sanitizeWindows(windows)

    const key = desktopStateKey(projectId, authCtx.userId)
    const existing = await db.desktopState.findUnique({ where: key })

    if (!existing) {
      await db.desktopState.create({
        data: {
          projectId,
          userId: authCtx.userId,
          name: DESKTOP_NAME,
          windows: sanitizedWindows,
          desktop: desktop as Prisma.InputJsonValue,
          version: 1,
        },
      })
      return json({ data: { version: 1 } }, { status: 201 })
    }

    // Optimistic concurrency: only advance when the client's version matches.
    const updated = await db.desktopState.updateMany({
      where: {
        projectId,
        userId: authCtx.userId,
        name: DESKTOP_NAME,
        version:
          typeof clientVersion === "number" ? clientVersion : existing.version,
      },
      data: {
        windows: sanitizedWindows,
        desktop: desktop as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      throw conflict("Desktop state changed on the server. Refetch and retry.")
    }

    return json({ data: { version: existing.version + 1 } })
  } catch (error) {
    return handleRouteError(error)
  }
}
