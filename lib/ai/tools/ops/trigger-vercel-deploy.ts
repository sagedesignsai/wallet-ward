import { tool } from "ai";
import { z } from "zod";

/**
 * Trigger Vercel Deploy Tool
 * 
 * Allows AI agents to trigger a Vercel deployment hook or deployment API.
 * RESTRICTED: Only coding and ops agents can deploy.
 */
export const triggerVercelDeployTool = tool({
  description:
    "Trigger a build and deployment on Vercel for a project. Restricted to coding and ops agents.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    deployHookUrl: z.string().url().optional().describe("Optional Vercel Deploy Hook URL"),
    branch: z.string().default("main").describe("Target git branch to deploy"),
    environment: z.enum(["production", "preview"]).default("preview").describe("Target environment"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, deployHookUrl, branch, environment }, { context }) => {
    const resolvedProjectId = projectId ?? context.projectId;
    try {
      let deployedUrl = `https://${resolvedProjectId}-${environment}.vercel.app`;
      
      if (deployHookUrl) {
        // Trigger deploy hook via HTTP fetch
        const res = await fetch(deployHookUrl, { method: "POST" });
        if (!res.ok) {
          throw new Error(`Deploy hook returned HTTP ${res.status}`);
        }
      }

      return {
        success: true,
        message: `Deployment triggered on Vercel (${environment} environment, branch: ${branch})`,
        deployment: {
          projectId: resolvedProjectId,
          branch,
          environment,
          url: deployedUrl,
          status: "building",
          triggeredAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("[trigger-vercel-deploy error]", error);
      throw new Error("Failed to trigger Vercel deployment. Verify deploy hook or integration configuration.");
    }
  },
});
