import { tool } from "ai";
import { z } from "zod";

/**
 * Read Sandbox File Tool
 *
 * Reads a file from the sandbox filesystem and returns its content as a string.
 * RESTRICTED: Only coding agents can read sandbox files.
 */
export const readSandboxFileTool = tool({
  description:
    "Read the contents of a file from a running Daytona sandbox. Returns the file content as a UTF-8 string. Useful for inspecting logs, config files, or source code inside the sandbox without downloading them manually.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox"),
    path: z.string().describe("The absolute path to the file within the sandbox"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    agentType: z.enum(["coding"]).describe("Only coding agents can read sandbox files"),
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

      // downloadFile returns a Buffer — convert to string
      const buffer = await sandbox.fs.downloadFile(path);
      const content = Buffer.from(buffer).toString("utf-8");

      return {
        sandboxId,
        path,
        content,
        sizeBytes: buffer.length,
      };
    } catch (error) {
      console.error("[read-sandbox-file error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to read sandbox file. Is the sandbox running and does the file exist?",
      );
    }
  },
});
