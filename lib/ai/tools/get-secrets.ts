import { tool } from "ai";
import { z } from "zod";

/**
 * Get Secrets Tool
 * 
 * Retrieves secrets from a project environment.
 * Returns secret names and types, but NOT values (for security).
 * 
 * RESTRICTED: Only coding and ops agents can access secrets.
 * Content and research agents cannot use this tool.
 */
export const getSecretsTool = tool({
  description:
    "Retrieve secrets from a project environment. Returns secret names and types, but NOT values (for security). Restricted to coding and ops agents.",
  inputSchema: z.object({
    projectId: z.string().describe("The project ID"),
    environmentId: z.string().describe("The environment ID (e.g., prod, staging)"),
    filterByType: z
      .enum(["password", "env_var", "ssh_keypair", "api_token", "certificate", "json", "file", "note"])
      .optional()
      .describe("Optional: filter secrets by type"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    agentType: z.enum(["coding", "ops"]).describe("Only coding and ops agents can access secrets"),
  }),
  execute: async ({ projectId, environmentId, filterByType }, { context }) => {
    try {
      const { prisma } = await import("@/lib/db");

      const secrets = await prisma.secret.findMany({
        where: {
          projectId,
          environmentId,
          type: filterByType,
          project: {
            organizationId: context.organizationId,
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          currentVersion: true,
        },
        orderBy: { name: "asc" },
      });

      return {
        count: secrets.length,
        secrets: secrets.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          description: s.description || null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          hasValue: s.currentVersion > 0,
        })),
      };
    } catch (error) {
      console.error("[get-secrets error]", error);
      throw new Error("Failed to retrieve secrets. Please try again.");
    }
  },
});
