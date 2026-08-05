import { db } from "@/lib/db"
import { notFound } from "@/lib/api/errors"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import type { Permission } from "@/lib/permissions"

/**
 * Require an authenticated caller that (a) belongs to the organization that
 * owns `projectId` and (b) holds `permission` in that organization.
 *
 * Nonexistent project → 404. Non-member / insufficient role → 403 (thrown by
 * requireOrganization/requirePermission). API keys are covered too: they carry
 * their organization and role in metadata, so a viewer-scoped key is denied
 * write permissions here.
 *
 * Returns the auth context, the (lightweight) project row, and the resolved
 * org context for downstream use (audit logs etc.).
 */
export async function requireProjectAccess(
  projectId: string,
  permission: Permission
) {
  const ctx = await requireAuth()
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  })
  if (!project) throw notFound("Project not found")
  const org = await requireOrganization(ctx, project.organizationId)
  requirePermission(org.memberRole, permission)
  return { ctx, project, org }
}
