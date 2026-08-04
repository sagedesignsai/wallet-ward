import { tool } from "ai";
import { z } from "zod";

/**
 * Stop Desktop Tool
 *
 * Stops the graphical desktop environment (VNC) on a Daytona sandbox.
 * RESTRICTED: Only coding agents can stop desktops.
 */
export const stopDesktopTool = tool({
  description:
    "Stop the graphical desktop environment (VNC) on a Daytona sandbox. Shuts down Xvfb, xfce4, x11vnc, and novnc processes. Use this when desktop resources are no longer needed.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sandboxId }, { context }) => {
    try {
      const { stopComputerUse } = await import("@/lib/daytona");

      const result = await stopComputerUse(sandboxId);

      return {
        message: result.message,
        sandboxId,
      };
    } catch (error) {
      console.error("[stop-desktop error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to stop desktop. Is the sandbox running?",
      );
    }
  },
});
