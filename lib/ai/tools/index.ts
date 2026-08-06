/**
 * Tool Definitions for Flowspace AI Agents
 *
 * Tools are organized by domain. Each specialist agent imports directly from
 * its domain folder. This file re-exports everything for convenience.
 *
 * Domain groups:
 *   sandbox/  — Daytona cloud sandbox, code execution, desktop/VNC, file ops
 *   ops/      — task management, deployments, notifications, audit logs
 *   content/  — documents, email, Notion, Airtable, Jira, Trello
 *   shared/   — cross-agent tools: projects, repos, secrets, proposals, proxy
 */

// ─── Sandbox tools ────────────────────────────────────────────────────────────
export { createSandboxTool } from "./sandbox/create-sandbox"
export { executeCommandTool } from "./sandbox/execute-command"
export { getSandboxPreviewTool } from "./sandbox/get-sandbox-preview"
export { cloneRepositoryTool } from "./sandbox/clone-repository"
export { startDesktopTool } from "./sandbox/start-desktop"
export { stopDesktopTool } from "./sandbox/stop-desktop"
export { computerUseTool } from "./sandbox/computer-use"
export { getWebTerminalUrlTool } from "./sandbox/get-web-terminal-url"
export { listSandboxFilesTool } from "./sandbox/list-sandbox-files"
export { readSandboxFileTool } from "./sandbox/read-sandbox-file"
export { opencodeSubagentTool } from "./sandbox/opencode-subagent"

// ─── Ops tools ────────────────────────────────────────────────────────────────
export { getTasksTool } from "./ops/get-tasks"
export { createTaskTool } from "./ops/create-task"
export { searchAuditLogsTool } from "./ops/search-audit-logs"
export { triggerVercelDeployTool } from "./ops/trigger-vercel-deploy"
export { createGithubPullRequestTool } from "./ops/create-github-pr"
export { sendSlackNotificationTool } from "./ops/send-slack-notification"

// ─── Content tools ────────────────────────────────────────────────────────────
export { getDocumentsTool } from "./content/get-documents"
export { createDocumentTool } from "./content/create-document"
export { sendEmailTool } from "./content/send-email"
export { airtableCreateRecordTool } from "./content/airtable-create-record"
export { jiraCreateIssueTool } from "./content/jira-create-issue"
export { notionCreatePageTool } from "./content/notion-create-page"
export { trelloCreateCardTool } from "./content/trello-create-card"
export { generatePdfTool } from "./content/generate-pdf"

// ─── Shared tools ─────────────────────────────────────────────────────────────
export { getProjectsTool } from "./shared/get-projects"
export { getRepositoriesTool } from "./shared/get-repositories"
export { getProjectFilesTool } from "./shared/get-project-files"
export { createArtifactTool } from "./shared/create-artifact"
export { getSecretsTool } from "./shared/get-secrets"
export { agentProxyTool } from "./shared/agent-proxy"
export { proposeActionTool } from "./shared/propose-action"
export { getPendingProposalsTool } from "./shared/get-pending-proposals"
