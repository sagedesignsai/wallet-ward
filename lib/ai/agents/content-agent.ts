import { ToolLoopAgent, isStepCount } from "ai"
import { getModel, SYSTEM_PROMPTS } from "@/lib/ai/config"
import type {
  ContentAgentContext,
  AgentRuntimeContext,
} from "@/lib/ai/context-builders"

// Content tools (including the 4 previously orphaned tools)
import { getDocumentsTool } from "@/lib/ai/tools/content/get-documents"
import { createDocumentTool } from "@/lib/ai/tools/content/create-document"
import { sendEmailTool } from "@/lib/ai/tools/content/send-email"
import { airtableCreateRecordTool } from "@/lib/ai/tools/content/airtable-create-record"
import { jiraCreateIssueTool } from "@/lib/ai/tools/content/jira-create-issue"
import { notionCreatePageTool } from "@/lib/ai/tools/content/notion-create-page"
import { trelloCreateCardTool } from "@/lib/ai/tools/content/trello-create-card"

// Ops tools content also uses
import { sendSlackNotificationTool } from "@/lib/ai/tools/ops/send-slack-notification"
import { searchAuditLogsTool } from "@/lib/ai/tools/ops/search-audit-logs"

// Shared tools
import { getProjectsTool } from "@/lib/ai/tools/shared/get-projects"
import { getRepositoriesTool } from "@/lib/ai/tools/shared/get-repositories"
import { getProjectFilesTool } from "@/lib/ai/tools/shared/get-project-files"
import { agentProxyTool } from "@/lib/ai/tools/shared/agent-proxy"
import { proposeActionTool } from "@/lib/ai/tools/shared/propose-action"
import { getPendingProposalsTool } from "@/lib/ai/tools/shared/get-pending-proposals"

export const contentAgentTools = {
  getDocuments: getDocumentsTool,
  createDocument: createDocumentTool,
  sendEmail: sendEmailTool,
  airtableCreateRecord: airtableCreateRecordTool,
  jiraCreateIssue: jiraCreateIssueTool,
  notionCreatePage: notionCreatePageTool,
  trelloCreateCard: trelloCreateCardTool,
  sendSlackNotification: sendSlackNotificationTool,
  searchAuditLogs: searchAuditLogsTool,
  getProjects: getProjectsTool,
  getRepositories: getRepositoriesTool,
  getProjectFiles: getProjectFilesTool,
  agentProxy: agentProxyTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
} as const

/**
 * Options for constructing a content agent.
 * toolsContext is required — every tool in the set declares a contextSchema.
 */
export interface ContentAgentOptions {
  toolsContext: ContentAgentContext
  runtimeContext?: AgentRuntimeContext
}

/**
 * Content Agent
 *
 * Autonomous writer and content manager. Creates documents, sends emails,
 * publishes to Notion/Airtable/Jira/Trello. Cannot access secrets or
 * execute code — content-only tool surface.
 */
export function createContentAgent(options: ContentAgentOptions) {
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: SYSTEM_PROMPTS.content,
    tools: contentAgentTools,
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(20),
  })
}

export type ContentAgent = ReturnType<typeof createContentAgent>
