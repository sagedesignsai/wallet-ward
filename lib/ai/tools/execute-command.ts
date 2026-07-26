import { tool } from "ai";
import { z } from "zod";

/**
 * Execute Command Tool
 *
 * Executes a shell command inside a running Daytona sandbox.
 * RESTRICTED: Only coding agents can execute commands.
 */
export const executeCommandTool = tool({
  description:
    "Execute a shell command inside a running Daytona sandbox. Returns stdout, stderr, and exit code. Restricted to coding agents.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox to execute in"),
    command: z.string().describe("The shell command to execute"),
    cwd: z
      .string()
      .optional()
      .describe("Working directory inside the sandbox (default: /home/user)"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in seconds (default: 30)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    agentType: z.enum(["coding"]).describe("Only coding agents can execute commands"),
  }),
  execute: async ({ sandboxId, command, cwd, timeout }, { context }) => {
    try {
      const { getDaytonaClient } = await import("@/lib/daytona");

      const client = getDaytonaClient();
      if (!client) {
        throw new Error(
          "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
        );
      }

      const sandbox = await client.get(sandboxId);

      const result = await sandbox.process.executeCommand(
        command,
        cwd,
        {},
        timeout,
      );

      return {
        result: result.result ?? result.artifacts?.stdout ?? "",
        exitCode: result.exitCode ?? 0,
      };
    } catch (error) {
      console.error("[execute-command error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to execute command. Please try again.",
      );
    }
  },
});
