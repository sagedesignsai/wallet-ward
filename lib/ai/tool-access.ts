/**
 * Tool Context Validation
 *
 * Defines which agent types can use which tools.
 * Used by the agent runtime to validate tool access.
 */

import type { AgentType } from "@/generated/prisma/client"

export type ToolAccessLevel = "all" | "coding" | "ops" | "content" | "research"

export const TOOL_ACCESS_MATRIX: Record<string, AgentType[]> = {
  // Sandbox & Execution (Coding Agent)
  createSandbox: ["coding"],
  executeCommand: ["coding"],
  getSandboxPreview: ["coding"],

  // Deployment & Infrastructure (Coding, Ops)
  triggerVercelDeploy: ["coding", "ops"],
  createGithubPullRequest: ["coding", "ops"],

  // Notifications & Communication (All)
  sendSlackNotification: ["coding", "ops", "content"],

  // Content Creation (Content, Ops, Research)
  createDocument: ["content", "ops", "research"],
  getDocuments: ["content", "ops", "research"],

  // Task Management (Ops, Research)
  createTask: ["ops", "research"],
  getTasks: ["ops", "research"],

  // Secrets & Security (Coding, Ops only - NOT content/research)
  getSecrets: ["coding", "ops"],

  // Project Info (All)
  getProjects: ["coding", "ops", "content", "research"],

  // Audit Logs (Ops, Research)
  searchAuditLogs: ["ops", "research"],

  // External API Access (All - validated per integration)
  agentProxy: ["coding", "ops", "content", "research"],

  // Proposal & Approval (All)
  proposeAction: ["coding", "ops", "content", "research"],
  getPendingProposals: ["coding", "ops", "content", "research"],
}

/**
 * Check if an agent type can use a tool
 */
export function canAgentUseTool(
  agentType: AgentType,
  toolName: string
): boolean {
  const allowedTypes = TOOL_ACCESS_MATRIX[toolName]
  if (!allowedTypes) {
    // Tool not found in matrix - allow by default (new tools)
    return true
  }
  return allowedTypes.includes(agentType)
}

/**
 * Get friendly error message for denied tool access
 */
export function getToolAccessDeniedMessage(
  agentType: AgentType,
  toolName: string
): string {
  const allowedTypes = TOOL_ACCESS_MATRIX[toolName]
  if (!allowedTypes) return `Tool '${toolName}' not found`

  if (allowedTypes.length === 0) {
    return `Tool '${toolName}' is not available`
  }

  const typeList = allowedTypes.join(", ")
  return `Tool '${toolName}' is only available to ${typeList} agents, not ${agentType}`
}

/**
 * Agent type descriptions
 */
export const AGENT_TYPE_DESCRIPTIONS: Record<AgentType, string> = {
  coding:
    "Build, test, and deploy applications in Daytona sandboxes. Can access all dev tools, secrets, and deployment services.",
  content:
    "Create and manage content (documents, blog posts, newsletters). Limited to content creation, cannot access secrets or deployments.",
  ops:
    "Manage tasks, handle operations, send notifications. Can trigger deployments and access audit logs.",
  research:
    "Gather information and synthesize reports. Can access documents, tasks, and audit logs, but not execute code or trigger deployments.",
}

/**
 * Get tool restrictions for an agent type
 */
export function getToolRestrictionsForAgentType(
  agentType: AgentType
): {
  allowedTools: string[]
  deniedTools: string[]
  restrictions: string[]
} {
  const allowedTools = Object.entries(TOOL_ACCESS_MATRIX)
    .filter(([_, types]) => types.includes(agentType))
    .map(([name]) => name)

  const deniedTools = Object.entries(TOOL_ACCESS_MATRIX)
    .filter(([_, types]) => !types.includes(agentType))
    .map(([name]) => name)

  const restrictions: string[] = []

  if (agentType === "content") {
    restrictions.push(
      "Cannot access secrets or environment variables",
      "Cannot execute code or deploy",
      "Cannot access audit logs"
    )
  } else if (agentType === "research") {
    restrictions.push(
      "Cannot execute code or deploy",
      "Cannot access secrets or environment variables",
      "Cannot create/modify tasks (read-only)"
    )
  } else if (agentType === "coding") {
    restrictions.push(
      "Can execute code in isolated Daytona sandboxes",
      "Can access integrations (GitHub, Vercel, Slack)",
      "Must propose high-risk actions (deployments, secret changes)"
    )
  } else if (agentType === "ops") {
    restrictions.push(
      "Cannot execute arbitrary code",
      "Can trigger deployments via integrations",
      "Limited to task and notification management"
    )
  }

  return {
    allowedTools,
    deniedTools,
    restrictions,
  }
}
