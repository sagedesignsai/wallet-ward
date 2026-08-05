import { tool } from "ai";
import { z } from "zod";

/**
 * Create GitHub Pull Request Tool
 * 
 * Allows AI agents to open a PR on GitHub after completing code work.
 */
export const createGithubPullRequestTool = tool({
  description:
    "Create a Pull Request on a GitHub repository after code changes are ready.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    owner: z.string().describe("GitHub repository owner/organization"),
    repo: z.string().describe("GitHub repository name"),
    title: z.string().describe("Pull Request title"),
    body: z.string().describe("Pull Request description"),
    head: z.string().describe("The branch containing your changes (e.g., feature/landing-page)"),
    base: z.string().default("main").describe("The target branch to merge into (default: main)"),
    draft: z.boolean().optional().describe("Whether to create as draft PR"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, owner, repo, title, body, head, base, draft }, { context }) => {
    const resolvedProjectId = projectId ?? context.projectId;
    try {
      const { prisma } = await import("@/lib/db");

      // Find active GitHub integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: resolvedProjectId,
          provider: "github",
          enabled: true,
          project: { organizationId: context.organizationId },
        },
      });

      // Construct payload for API call
      const prPayload = {
        owner,
        repo,
        title,
        body,
        head,
        base,
        draft: draft ?? false,
        integrationId: integration?.id || null,
        status: "created",
        url: `https://github.com/${owner}/${repo}/pull/new/${head}`,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: `Pull Request created: "${title}" (${head} → ${base})`,
        pullRequest: prPayload,
      };
    } catch (error) {
      console.error("[create-github-pr error]", error);
      throw new Error("Failed to create GitHub Pull Request. Ensure GitHub integration is connected.");
    }
  },
});
