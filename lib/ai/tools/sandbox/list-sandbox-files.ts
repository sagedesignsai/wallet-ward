import { tool } from "ai";
import { z } from "zod";

/**
 * List Sandbox Files Tool
 *
 * Lists files in a sandbox directory.
 * RESTRICTED: Only coding agents can list sandbox files.
 */
export const listSandboxFilesTool = tool({
  description:
    "List files and directories inside a running Daytona sandbox at the specified path. Returns file names, types (file/directory), and sizes. Useful for exploring the sandbox filesystem before reading or executing files.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox"),
    path: z
      .string()
      .default("/home/user")
      .describe("The directory path to list (default: /home/user)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sandboxId, path }, { context }) => {
    try {
      const { getDaytonaClient } = await import("@/lib/daytona");

      const client = getDaytonaClient();
      if (!client) {
        throw new Error(
          "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
        );
      }

      const sandbox = await client.get(sandboxId);
      const files = await sandbox.fs.listFiles(path);

      return {
        sandboxId,
        path,
        files,
      };
    } catch (error) {
      console.error("[list-sandbox-files error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to list sandbox files. Is the sandbox running?",
      );
    }
  },
});
