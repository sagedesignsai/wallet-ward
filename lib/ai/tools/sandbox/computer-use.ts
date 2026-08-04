import { tool } from "ai";
import { z } from "zod";

/**
 * Computer Use Tool
 *
 * Single dispatch tool for all programmatic desktop interactions —
 * mouse, keyboard, screenshot, and display info.
 * RESTRICTED: Only coding agents can control desktops.
 */
export const computerUseTool = tool({
  description:
    "Programmatically control a sandbox's graphical desktop. Requires the desktop to be started first (use start-desktop). Actions: mouseClick, mouseMove, mouseDrag, mouseScroll, keyboardType, keyboardPress, keyboardHotkey, screenshot, displayInfo.",
  inputSchema: z.object({
    sandboxId: z.string().describe("The ID of the sandbox"),
    action: z
      .enum([
        "mouseClick",
        "mouseMove",
        "mouseDrag",
        "mouseScroll",
        "keyboardType",
        "keyboardPress",
        "keyboardHotkey",
        "screenshot",
        "displayInfo",
      ])
      .describe("The action to perform"),
    x: z.number().optional().describe("X coordinate (for mouse actions)"),
    y: z.number().optional().describe("Y coordinate (for mouse actions)"),
    button: z
      .enum(["left", "right", "middle"])
      .optional()
      .describe("Mouse button (for click/drag)"),
    double: z.boolean().optional().describe("Double-click (for mouseClick)"),
    direction: z
      .enum(["up", "down"])
      .optional()
      .describe("Scroll direction (for mouseScroll)"),
    amount: z.number().optional().describe("Scroll amount (for mouseScroll)"),
    text: z.string().optional().describe("Text to type (for keyboardType)"),
    key: z.string().optional().describe("Key name (for keyboardPress)"),
    modifiers: z
      .array(z.string())
      .optional()
      .describe("Modifier keys (for keyboardPress)"),
    keys: z
      .string()
      .optional()
      .describe("Hotkey chord like 'ctrl+c' (for keyboardHotkey)"),
    delay: z
      .number()
      .optional()
      .describe("Delay between keystrokes in ms (for keyboardType)"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async (input, { context }) => {
    try {
      const { getDaytonaClient } = await import("@/lib/daytona");

      const client = getDaytonaClient();
      if (!client) {
        throw new Error(
          "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
        );
      }

      const sandbox = await client.get(input.sandboxId);
      const cu = sandbox.computerUse;

      switch (input.action) {
        case "mouseClick": {
          const x = input.x!;
          const y = input.y!;
          const r = await cu.mouse.click(x, y, input.button, input.double);
          return { result: `Clicked at (${r.x}, ${r.y})` };
        }
        case "mouseMove": {
          const x = input.x!;
          const y = input.y!;
          const r = await cu.mouse.move(x, y);
          return { result: `Moved to (${r.x}, ${r.y})` };
        }
        case "mouseDrag": {
          const x = input.x!;
          const y = input.y!;
          const pos = await cu.mouse.getPosition();
          const r = await cu.mouse.drag(pos.x!, pos.y!, x, y, input.button);
          return { result: `Dragged to (${r.x}, ${r.y})` };
        }
        case "mouseScroll": {
          const x = input.x!;
          const y = input.y!;
          const direction = input.direction!;
          const success = await cu.mouse.scroll(x, y, direction, input.amount);
          return { result: success ? "Scrolled successfully" : "Scroll failed" };
        }
        case "keyboardType": {
          if (!input.text) throw new Error("text is required for keyboardType");
          await cu.keyboard.type(input.text, input.delay);
          return { result: `Typed text (${input.text.length} characters)` };
        }
        case "keyboardPress": {
          if (!input.key) throw new Error("key is required for keyboardPress");
          await cu.keyboard.press(input.key, input.modifiers);
          return { result: `Pressed key: ${input.key}` };
        }
        case "keyboardHotkey": {
          if (!input.keys) throw new Error("keys is required for keyboardHotkey");
          await cu.keyboard.hotkey(input.keys);
          return { result: `Executed hotkey: ${input.keys}` };
        }
        case "screenshot": {
          const shot = await cu.screenshot.takeFullScreen();
          return {
            result: "Screenshot captured",
            screenshot: shot.screenshot,
            sizeBytes: shot.sizeBytes,
            format: "base64",
          };
        }
        case "displayInfo": {
          const info = await cu.display.getInfo();
          const windowInfo = await cu.display.getWindows();
          return {
            result: "Display info retrieved",
            displays: info.displays,
            windows: windowInfo.windows,
          };
        }
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      console.error("[computer-use error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to execute computer use action",
      );
    }
  },
});
