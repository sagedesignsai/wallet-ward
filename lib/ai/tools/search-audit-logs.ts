import { tool } from "ai";
import { z } from "zod";

/**
 * Search Audit Logs Tool
 * 
 * Searches audit logs to see recent activity and changes.
 */
export const searchAuditLogsTool = tool({
  description: "Search audit logs to see recent activity, changes, and who made them.",
  inputSchema: z.object({
    action: z
      .enum([
        "organization_create",
        "project_create",
        "project_update",
        "project_delete",
        "environment_create",
        "secret_create",
        "secret_update",
        "secret_delete",
        "secret_reveal",
        "document_create",
        "document_update",
        "task_create",
        "task_update",
      ])
      .optional()
      .describe("Optional: filter by action type"),
    limit: z.number().min(1).max(50).default(10).describe("Number of logs to return (max 50)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ action, limit }, { context }) => {
    try {
      const { prisma } = await import("@/lib/db");

      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId: context.organizationId,
          ...(action && { action }),
        },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return {
        count: logs.length,
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId || null,
          actor: log.actor?.name || log.actor?.email || "System",
          timestamp: log.createdAt.toISOString(),
          metadata: log.metadata,
        })),
      };
    } catch (error) {
      console.error("[search-audit-logs error]", error);
      throw new Error("Failed to search audit logs. Please try again.");
    }
  },
});
