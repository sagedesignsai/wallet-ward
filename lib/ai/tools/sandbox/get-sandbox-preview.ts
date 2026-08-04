import { tool } from "ai";
import { z } from "zod";

/**
 * Get Sandbox Preview Tool
 *
 * Gets a live preview URL for a running Daytona sandbox.
 */
export const getSandboxPreviewTool = tool({
  description:
    "Get a live preview URL for a running Daytona sandbox. Returns the URL and an optional access token.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox"),
    port: z
      .number()
      .optional()
      .describe("The port to preview (default: 3000)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sandboxId, port }, { context }) => {
    try {
      const { getDaytonaClient } = await import("@/lib/daytona");

      const client = getDaytonaClient();
      if (!client) {
        throw new Error(
          "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
        );
      }

      const sandbox = await client.get(sandboxId);

      const link = await sandbox.getPreviewLink(port ?? 3000);

      // PortPreviewUrl always has url and token, but we handle string defensively
      if (typeof link === "string") {
        return { url: link, token: undefined, sandboxId };
      }

      return {
        url: (link as { url: string }).url,
        token: (link as { token?: string }).token,
        sandboxId,
      };
    } catch (error) {
      console.error("[get-sandbox-preview error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get sandbox preview. Please try again.",
      );
    }
  },
});
