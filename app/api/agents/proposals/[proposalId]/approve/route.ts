import { requireAuth, requireOrganization } from "@/lib/api/auth";
import { json, handleRouteError } from "@/lib/api/http";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/services/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  try {
    const rawAuth = await requireAuth();
    const auth = await requireOrganization(rawAuth);
    const { proposalId } = await params;

    // Find the proposal log
    const proposalLog = await prisma.auditLog.findFirst({
      where: {
        resourceType: "action_proposal",
        resourceId: proposalId,
        organizationId: auth.organizationId,
      },
    });

    if (!proposalLog) {
      return json({ error: "Proposal not found" }, { status: 404 });
    }

    const currentMeta = (proposalLog.metadata as Record<string, unknown>) || {};
    const updatedMeta = {
      ...currentMeta,
      status: "approved",
      approvedByUserId: auth.userId,
      approvedAt: new Date().toISOString(),
    };

    // Update log metadata
    await prisma.auditLog.update({
      where: { id: proposalLog.id },
      data: { metadata: updatedMeta },
    });

    // Record audit trail
    await writeAuditLog({
      ctx: auth,
      organizationId: auth.organizationId,
      action: "task_update",
      resourceType: "action_proposal",
      resourceId: proposalId,
      metadata: {
        proposalId,
        action: "approved",
        title: (currentMeta.title as string) || proposalId,
      },
    });

    return json({
      success: true,
      proposalId,
      status: "approved",
      message: `Proposal "${currentMeta.title || proposalId}" has been approved for execution.`,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
