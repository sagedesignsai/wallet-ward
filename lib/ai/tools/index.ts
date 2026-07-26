/**
 * Tool Definitions for Flowspace AI Agent
 * 
 * This module exports all workspace tools that the agent can use.
 * Each tool is defined in its own file for better organization and maintainability.
 */

import { getSecretsTool } from "./get-secrets";
import { getDocumentsTool } from "./get-documents";
import { createDocumentTool } from "./create-document";
import { getTasksTool } from "./get-tasks";
import { createTaskTool } from "./create-task";
import { getProjectsTool } from "./get-projects";
import { searchAuditLogsTool } from "./search-audit-logs";
import { createSandboxTool } from "./create-sandbox";
import { executeCommandTool } from "./execute-command";
import { getSandboxPreviewTool } from "./get-sandbox-preview";
import { agentProxyTool } from "./agent-proxy";
import { createGithubPullRequestTool } from "./create-github-pr";
import { triggerVercelDeployTool } from "./trigger-vercel-deploy";
import { sendSlackNotificationTool } from "./send-slack-notification";
import { proposeActionTool } from "./propose-action";
import { getPendingProposalsTool } from "./get-pending-proposals";

/**
 * All available tools for the Flowspace agent suite
 */
export const workspaceTools = {
  getSecrets: getSecretsTool,
  getDocuments: getDocumentsTool,
  createDocument: createDocumentTool,
  getTasks: getTasksTool,
  createTask: createTaskTool,
  getProjects: getProjectsTool,
  searchAuditLogs: searchAuditLogsTool,
  createSandbox: createSandboxTool,
  executeCommand: executeCommandTool,
  getSandboxPreview: getSandboxPreviewTool,
  agentProxy: agentProxyTool,
  createGithubPullRequest: createGithubPullRequestTool,
  triggerVercelDeploy: triggerVercelDeployTool,
  sendSlackNotification: sendSlackNotificationTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
} as const;
