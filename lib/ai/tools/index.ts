/**
 * Tool Definitions for Nimbus AI Agent
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

/**
 * All available tools for the base agent
 */
export const workspaceTools = {
  getSecrets: getSecretsTool,
  getDocuments: getDocumentsTool,
  createDocument: createDocumentTool,
  getTasks: getTasksTool,
  createTask: createTaskTool,
  getProjects: getProjectsTool,
  searchAuditLogs: searchAuditLogsTool,
} as const;
