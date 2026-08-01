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
import { sendEmailTool } from "./send-email";
import { proposeActionTool } from "./propose-action";
import { getPendingProposalsTool } from "./get-pending-proposals";
import { getRepositoriesTool } from "./get-repositories";
import { getProjectFilesTool } from "./get-project-files";
import { cloneRepositoryTool } from "./clone-repository";
import { startDesktopTool } from "./start-desktop";
import { stopDesktopTool } from "./stop-desktop";
import { computerUseTool } from "./computer-use";
import { getWebTerminalUrlTool } from "./get-web-terminal-url";
import { listSandboxFilesTool } from "./list-sandbox-files";
import { readSandboxFileTool } from "./read-sandbox-file";

import { opencodeSubagentTool } from "./opencode-subagent";

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
  sendEmail: sendEmailTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
  getRepositories: getRepositoriesTool,
  getProjectFiles: getProjectFilesTool,
  cloneRepository: cloneRepositoryTool,
  startDesktop: startDesktopTool,
  stopDesktop: stopDesktopTool,
  computerUse: computerUseTool,
  getWebTerminalUrl: getWebTerminalUrlTool,
  listSandboxFiles: listSandboxFilesTool,
  readSandboxFile: readSandboxFileTool,
  opencodeSubagent: opencodeSubagentTool,
} as const;
