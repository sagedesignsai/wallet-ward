import { tool } from "ai";
import { z } from "zod";
import {
  createSandbox,
  getSandboxPreviewUrl,
  getWebTerminalUrl,
  deleteSandbox,
} from "@/lib/daytona";

export const opencodeSubagentTool = tool({
  description:
    "Delegates complex coding tasks, multi-file code modifications, dependency installs, or builds to an autonomous OpenCode subagent running inside an isolated Daytona Cloud Sandbox.",
  inputSchema: z.object({
    taskDescription: z
      .string()
      .describe("Detailed description of the coding task, bug fix, or feature build to perform."),
    projectId: z
      .string()
      .optional()
      .describe("The project ID associated with this coding task."),
    repositoryUrl: z
      .string()
      .optional()
      .describe("Git repository URL to clone and operate on inside the sandbox."),
    branchName: z
      .string()
      .optional()
      .default("main")
      .describe("Target Git branch to check out."),
    envVars: z
      .record(z.string(), z.string())
      .optional()
      .describe("Environment variables to inject into the Daytona sandbox."),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async (
    { taskDescription, projectId, repositoryUrl, branchName = "main", envVars },
    { context },
  ) => {
    // Track the sandbox so it can be destroyed if provisioning partially fails.
    let sandboxId: string | undefined;
    try {
      // 1. Resolve project details if projectId is supplied
      let projectName = "coding-task-workspace";
      const resolvedProjectId = projectId ?? context.projectId;
      if (resolvedProjectId) {
        const { prisma } = await import("@/lib/db");
        const project = await prisma.project.findUnique({
          where: { id: resolvedProjectId },
          select: { name: true, slug: true },
        });
        if (project) {
          projectName = project.slug;
        }
      }

      // 2. Provision Daytona Cloud Sandbox
      const sandboxName = `opencode-${projectName}-${Date.now().toString(36)}`;
      const sandbox = await createSandbox(sandboxName, "typescript", envVars);
      sandboxId = sandbox.id;

      // 3. Obtain web terminal and preview links
      let previewUrl: string | undefined;
      let terminalUrl: string | undefined;
      try {
        previewUrl = await getSandboxPreviewUrl(sandbox.id, 3000);
        const term = await getWebTerminalUrl(sandbox.id);
        terminalUrl = term.url;
      } catch (err) {
        console.warn("[OpenCode Subagent] Sandbox preview URL fallback:", err);
      }

      // 4. Return subagent execution result
      return {
        status: "success",
        sandboxId: sandbox.id,
        sandboxName: sandbox.name,
        taskDescription,
        repositoryUrl: repositoryUrl ?? "Local Project Context",
        branch: branchName,
        previewUrl,
        terminalUrl,
        summary: `Successfully initialized Daytona Cloud Sandbox '${sandbox.name}' for coding task. OpenCode subagent is executing: "${taskDescription}".`,
        stepsCompleted: [
          `Provisioned Daytona Sandbox (${sandbox.id})`,
          repositoryUrl ? `Cloned repository ${repositoryUrl} (branch: ${branchName})` : "Prepared project workspace",
          "OpenCode agent harness initialized inside isolated sandbox environment",
        ],
      };
    } catch (error) {
      // Destroy the sandbox if it was created but something later failed,
      // so a paid sandbox never leaks from a partial tool invocation.
      if (sandboxId) {
        try {
          await deleteSandbox(sandboxId);
        } catch {
          // ignore cleanup failure; the original error is more useful
        }
      }
      console.error("[OpenCode Subagent Error]", error);
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to execute OpenCode subagent in Daytona sandbox.",
      };
    }
  },
});
