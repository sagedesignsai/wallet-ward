import { NextRequest } from "next/server"
import {
  getPresignedUploadUrl,
  buildObjectKey,
  MAX_FILE_SIZE,
} from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest } from "@/lib/api/errors"

/**
 * POST /api/v1/projects/:projectId/files/presign
 *
 * Step 1 of the two-step presigned upload flow.
 * Returns a presigned PUT URL the browser can use to upload directly to R2,
 * plus the storageKey to include in the subsequent /confirm call.
 *
 * Request body:
 *   { filename: string, mimeType: string, size: number }
 *
 * Response:
 *   { uploadUrl: string, storageKey: string, expiresIn: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    await requireProjectAccess(projectId, "project:write")

    const body = await req.json()
    const { filename, mimeType, size } = body

    if (!filename || typeof filename !== "string") {
      throw badRequest("Missing required field: filename")
    }
    if (!mimeType || typeof mimeType !== "string") {
      throw badRequest("Missing required field: mimeType")
    }
    // Reject NaN/Infinity explicitly: NaN < 0 is false, so a NaN size would
    // otherwise pass the old range check.
    if (
      typeof size !== "number" ||
      !Number.isFinite(size) ||
      size < 0 ||
      size > MAX_FILE_SIZE
    ) {
      throw badRequest("Invalid or oversized size")
    }

    // Build the R2 key — namespaced by project, collision-resistant
    const storageKey = buildObjectKey(projectId, filename)

    // Generate a 15-minute presigned PUT URL
    const { uploadUrl } = await getPresignedUploadUrl(storageKey, mimeType)

    return json({
      data: {
        uploadUrl,
        storageKey,
        expiresIn: 60 * 15,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
