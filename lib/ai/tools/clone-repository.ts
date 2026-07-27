import { tool } from "ai";
import { z } from "zod";

/**
 * Clone Repository Tool
 *
 * Clones a connected Git repository into a Daytona sandbox for code access.
 * The agent can then use executeCommand to browse and modify the cloned code.
 * RESTRICTED: Only coding agents can clone repositories.
 */
export const cloneRepositoryTool = tool({
  description: "Clone a connected Git repository into a running Daytona sandbox. After cloning, use executeCommand to browse and modify files. Requires an existing sandbox.",
  inputSchema: z.object({
    projectId: z.string().describe("The project ID"),
    repositoryId: z.string().describe("The repository ID from getRepositories"),
    sandboxId: z.string().describe("The sandbox ID to clone into"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    agentType: z.enum(["coding"]).describe("Only coding agents can clone repositories"),
  }),
  execute: async ({ projectId, repositoryId, sandboxId }, { context }) => {
    try {
      const { prisma } = await import("@/lib/db");

      // Verify repository exists and belongs to project
      const repository = await prisma.repository.findFirst({
        where: {
          id: repositoryId,
          projectId,
          project: { organizationId: context.organizationId },
        },
      });

      if (!repository) {
        throw new Error("Repository not found or access denied.");
      }

      // Get the Daytona client
      const { getDaytonaClient } = await import("@/lib/daytona");
      const client = getDaytonaClient();
      if (!client) {
        throw new Error("Daytona is not configured. Add DAYTONA_API_KEY to your environment.");
      }

      // Clone the repository into the sandbox
      const sandbox = await client.get(sandboxId);

      // Build clone command
      const cloneCmd = `git clone ${repository.url} ${repository.name}`;
      const result = await sandbox.process.executeCommand(cloneCmd, undefined, {}, 120);

      if (result.exitCode !== 0) {
        return {
          success: false,
          repository: {
            id: repository.id,
            name: repository.name,
            url: repository.url,
            branch: repository.branch,
          },
          error: result.artifacts?.stderr || result.result || "Clone failed",
          message: `Failed to clone ${repository.name}. The repository may require authentication.`,
        };
      }

      // Checkout the correct branch if not main
      if (repository.branch !== "main") {
        const branchCmd = `cd ${repository.name} && git checkout ${repository.branch}`;
        await sandbox.process.executeCommand(branchCmd, undefined, {}, 30);
      }

      return {
        success: true,
        repository: {
          id: repository.id,
          name: repository.name,
          url: repository.url,
          branch: repository.branch,
          provider: repository.provider,
        },
        sandbox: {
          id: sandboxId,
        },
        path: `/home/user/${repository.name}`,
        message: `Repository "${repository.name}" cloned successfully into sandbox. Working directory: /home/user/${repository.name}`,
      };
    } catch (error) {
      console.error("[clone-repository error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to clone repository. Please try again.",
      );
    }
  },
});
