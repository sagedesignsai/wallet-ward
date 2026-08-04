import { tool } from "ai";
import { z } from "zod";

/**
 * Start Desktop Tool
 *
 * Starts the graphical desktop environment (VNC) on a running Daytona sandbox.
 * RESTRICTED: Only coding agents can start desktops.
 */
export const startDesktopTool = tool({
  description:
    "Start the graphical desktop environment (VNC) on a running Daytona sandbox. Launches Xvfb, xfce4, x11vnc, and novnc. Returns a signed preview URL for the noVNC web client (port 6080) so you can view and interact with the desktop in a browser. Use this before any computer-use actions.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the running sandbox"),
    desktopUrlExpiry: z
      .number()
      .optional()
      .describe("Expiry in seconds for the desktop preview URL (default: 3600)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sandboxId, desktopUrlExpiry }, { context }) => {
    try {
      const { startComputerUse, getDesktopUrl } = await import("@/lib/daytona");

      const result = await startComputerUse(sandboxId);
      const { url, token } = await getDesktopUrl(sandboxId);

      return {
        message: result.message,
        desktopUrl: url,
        token,
        sandboxId,
        port: 6080,
        note: "Use the desktopUrl in an iframe or open it in a browser to see the graphical desktop.",
      };
    } catch (error) {
      console.error("[start-desktop error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to start desktop. Is the sandbox running?",
      );
    }
  },
});
