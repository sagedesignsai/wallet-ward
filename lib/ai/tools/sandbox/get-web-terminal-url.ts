import { tool } from "ai";
import { z } from "zod";

/**
 * Get Web Terminal URL Tool
 *
 * Returns a signed preview URL for the web terminal (port 22222) of a running sandbox.
 * Available to coding and ops agents.
 */
export const getWebTerminalUrlTool = tool({
  description:
    "Get a signed preview URL for the web terminal (port 22222) of a running Daytona sandbox. The URL includes an access token and can be opened in a browser or embedded in an iframe for interactive terminal access.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the running sandbox"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sandboxId }, { context }) => {
    try {
      const { getWebTerminalUrl } = await import("@/lib/daytona");

      const { url, token } = await getWebTerminalUrl(sandboxId);

      return {
        url,
        token,
        sandboxId,
      };
    } catch (error) {
      console.error("[get-web-terminal-url error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get web terminal URL. Is the sandbox running?",
      );
    }
  },
});
