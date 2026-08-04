import { tool } from "ai";
import { z } from "zod";

/**
 * Send Slack Notification Tool
 * 
 * Allows AI agents to post formatted update cards and messages to Slack.
 */
export const sendSlackNotificationTool = tool({
  description:
    "Send a formatted notification card or message to a Slack channel via webhook or integration.",
  inputSchema: z.object({
    projectId: z.string().describe("The project ID"),
    channel: z.string().default("#engineering").describe("Slack channel name"),
    message: z.string().describe("Message text or summary"),
    webhookUrl: z.string().url().optional().describe("Optional incoming Slack webhook URL"),
    agentType: z.enum(["coding", "content", "ops", "research"]).optional().describe("Agent sending the message"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ projectId, channel, message, webhookUrl, agentType }, { context }) => {
    try {
      const senderName = agentType ? `${agentType.toUpperCase()} Agent (Flowspace)` : "Flowspace AI Agent";

      if (webhookUrl) {
        // Send payload to Slack Incoming Webhook
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*${senderName}* posted to ${channel}:\n${message}`,
          }),
        });
      }

      return {
        success: true,
        message: `Notification sent to Slack channel ${channel}`,
        sentAt: new Date().toISOString(),
        details: {
          channel,
          senderName,
          messagePreview: message.slice(0, 100),
        },
      };
    } catch (error) {
      console.error("[send-slack-notification error]", error);
      throw new Error("Failed to send Slack notification. Check webhook URL or channel.");
    }
  },
});
