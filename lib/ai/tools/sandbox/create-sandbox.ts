import { tool } from "ai";
import { z } from "zod";

/**
 * Create Sandbox Tool
 *
 * Creates a new Daytona sandbox for isolated code execution.
 * RESTRICTED: Only coding agents can create sandboxes.
 */
export const createSandboxTool = tool({
  description:
    "Create a new Daytona sandbox for isolated code execution. Returns the sandbox ID, name, state, and resource allocation. Restricted to coding agents.",
  inputSchema: z.object({
    name: z.string().describe("A descriptive name for the sandbox"),
    language: z
      .enum(["javascript", "python", "typescript"])
      .optional()
      .describe("Programming language for the sandbox (default: javascript)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ name, language }, { context }) => {
    try {
      const { createSandbox } = await import("@/lib/daytona");

      const sandbox = await createSandbox(name, language);

      return {
        id: sandbox.id,
        name: sandbox.name,
        state: sandbox.state,
        cpu: sandbox.cpu,
        memory: sandbox.memory,
        disk: sandbox.disk,
        createdAt: sandbox.createdAt,
        message: `Sandbox "${sandbox.name}" created successfully (ID: ${sandbox.id}).`,
      };
    } catch (error) {
      console.error("[create-sandbox error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create sandbox. Please try again.",
      );
    }
  },
});
