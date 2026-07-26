# Agent Execution Contract

## Overview

An **Agent Execution Contract** defines the boundary between:
1. **What agents can see** (user instructions, project context, task definitions)
2. **What agents cannot see** (raw API keys, encrypted secrets)
3. **How agents access secrets safely** (via server-side vault proxy)
4. **How agents report results** (structured output, approval requests)

This ensures maximum autonomy while maintaining zero-leak security.

---

## 1. Agent Runtime Initialization

### 1.1 Context Injected by Server

When an agent session starts, the server builds an `AgentRuntimeContext`:

```typescript
interface AgentRuntimeContext {
  requestId: string;                    // Unique request ID for tracing
  workspaceContext: {
    userId: string;                      // Human who triggered the agent
    organizationId: string;              // Org scope (for all resource lookups)
    projectId: string;                   // Project scope (can be null for org-level agents)
    environmentId?: string;              // Optional environment scope
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;                     // ISO 8601 timestamp
}
```

### 1.2 System Prompt Selection

Based on agent type, the server selects a system prompt:

| Agent Type | System Prompt | Primary Tools |
|:---|:---|:---|
| **coding** | Builds, tests, deploys apps in Daytona sandboxes | createSandbox, executeCommand, getSandboxPreview, agentProxy, createGitHubPR |
| **content** | Drafts documents, marketing materials | createDocument, getDocuments, agentProxy (for social/CMS) |
| **ops** | Manages tasks, deployment pipelines, notifications | getTasks, createTask, searchAuditLogs, agentProxy (Slack/GitHub) |
| **research** | Gathers intelligence, synthesizes reports | getDocuments, getTasks, searchAuditLogs, agentProxy |

### 1.3 Available Tools (Tool Registry)

All agents have access to a **tool registry**. Each tool is defined with:
- **name**: Tool identifier
- **description**: What it does (visible to LLM)
- **inputSchema**: Zod schema for validation
- **contextSchema**: What context values it needs (organizationId, projectId, etc.)
- **execute**: The actual implementation

---

## 2. The "No Raw Secrets" Guarantee

### 2.1 Problem: Never Expose Raw Credentials to Agents

Agents must NOT see:
- Raw API keys, tokens, passwords
- Private SSH keys
- Database connection strings
- OAuth tokens

### 2.2 Solution: Server-Side Vault Proxy Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                        AGENT                                 │
│                                                               │
│  const result = await agentProxy({                           │
│    projectId: "proj_123",                                    │
│    service: "github",                                        │
│    method: "POST",                                           │
│    path: "/repos/owner/repo/pulls",                          │
│    body: { title, body, head, base }                         │
│  })                                                           │
│                                                               │
│  // Agent receives: { data: {...}, meta: {...} }            │
│  // Agent NEVER sees: the GitHub token                       │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ (1) Tool Call
                         │ (includes context: organizationId)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              AGENT-PROXY ENDPOINT                             │
│          /api/v1/agent-proxy (POST)                          │
│                                                               │
│  (1) Validate auth context & org scope                       │
│  (2) Look up Integration in DB:                              │
│      - WHERE projectId = input.projectId                     │
│      - AND provider = input.service                          │
│      - AND project.organizationId = ctx.organizationId       │
│  (3) Decrypt token with org DEK:                             │
│      - Fetch OrganizationEncryptionKey                       │
│      - Unwrap DEK (using HSM or app KMS)                     │
│      - Decrypt token from Integration record                 │
│  (4) Inject token into Authorization header                  │
│  (5) Execute proxied HTTP request to upstream service        │
│  (6) Return response (never raw token)                       │
│  (7) Log to audit trail                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ (6) Response
                         │ (no secrets)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                        AGENT                                  │
│                                                               │
│  // Works with the response data                             │
│  // No access to credentials                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Implementation: Agent Proxy Tool

```typescript
export const agentProxyTool = tool({
  description: "Make authenticated API call to external service (GitHub, Slack, Vercel)",
  inputSchema: z.object({
    projectId: z.string(),
    service: z.enum(["github", "slack", "vercel"]),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: z.string(),                    // e.g., "/repos/owner/repo/pulls"
    body: z.record(z.unknown()).optional(),
    query: z.record(z.string()).optional(),
  }),
  contextSchema: z.object({
    organizationId: z.string(),           // Injected by server
  }),
  execute: async (input, { context }) => {
    // Server-side execution — agent cannot interfere
    const integration = await findIntegration(
      input.projectId,
      input.service,
      context.organizationId
    );
    const token = await decryptToken(integration, context.organizationId);
    const response = await makeAuthenticatedRequest(token, input);
    return response;  // Token never returned to agent
  },
});
```

---

## 3. Secret Access Pattern

### 3.1 Agent Requests Secrets

Agents can call `getSecrets()` to list available secrets in a project:

```typescript
const secretsTool = tool({
  description: "Get list of available secrets in a project (names only, no values)",
  inputSchema: z.object({
    projectId: z.string().describe("Project ID"),
    environmentId: z.string().optional().describe("Environment ID (optional)"),
    type: z.enum(["env_var", "api_token", "password", "ssh_keypair", ...]).optional(),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async (input, { context }) => {
    // Returns ONLY secret metadata, never values
    const secrets = await prisma.secret.findMany({
      where: {
        projectId: input.projectId,
        environmentId: input.environmentId,
        type: input.type,
        project: { organizationId: context.organizationId },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        // NEVER select currentVersion.value or any encrypted data
      },
    });
    return { data: secrets };
  },
});
```

### 3.2 Agent Uses Secret (Example: Vercel Deployment)

```typescript
// What the agent DOES:
const result = await agentProxy({
  projectId: "proj_123",
  service: "vercel",
  method: "POST",
  path: "/v13/deployments",
  body: {
    name: "my-app",
    gitSource: { ref: "main", repo: "owner/repo" },
  },
});
// Agent never sees the Vercel token

// Agent is BLOCKED from doing this:
const token = await getSecretValue({  // ❌ This tool doesn't exist
  secretId: "sec_vercel_token",
});
```

---

## 4. Autonomous Task Execution Flow

### 4.1 Agent Creates a Task

```typescript
const createTaskTool = tool({
  description: "Create a new task in the project",
  inputSchema: z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    assigneeId: z.string().optional().describe("User ID or 'self' for current agent"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    userId: string;  // The human who triggered the agent
  }),
  execute: async (input, { context }) => {
    const task = await prisma.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
      },
    });
    // Log to audit trail
    await writeAuditLog({
      organizationId: context.organizationId,
      action: "task_create",
      resourceType: "task",
      resourceId: task.id,
      metadata: { createdBy: "agent", agentType: "coding" },
    });
    return { data: task };
  },
});
```

### 4.2 Agent Proposes High-Risk Action

```typescript
const proposeActionTool = tool({
  description: "Propose a high-risk action (deploy, delete, etc) for human approval",
  inputSchema: z.object({
    projectId: z.string(),
    title: z.string(),                    // "Deploy to Production"
    description: z.string(),              // Detailed breakdown
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    targetSystem: z.string(),             // "Vercel Production"
    actionType: z.enum(["deploy", "publish", "delete", "rotate_secret", "grant_access"]),
    payload: z.record(z.unknown()).optional(),  // Args for execution
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async (input, { context }) => {
    const proposalId = generateId();
    
    // Record in audit log with status: awaiting_approval
    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        action: "task_create",
        resourceType: "action_proposal",
        resourceId: proposalId,
        metadata: {
          proposalId,
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          riskLevel: input.riskLevel,
          targetSystem: input.targetSystem,
          actionType: input.actionType,
          status: "awaiting_approval",
          payload: input.payload ?? {},
        },
      },
    });
    
    return {
      proposalId,
      status: "awaiting_approval",
      message: `Action "${input.title}" submitted for approval.`,
    };
  },
});
```

---

## 5. Human-in-the-Loop Approval Lifecycle

### 5.1 User Reviews Proposal

When an agent proposes an action, the UI renders an action card:

```typescript
// In UI: /app/dashboard/agents/[sessionId]/proposals/[proposalId]
{
  proposalId: "prop_abc123",
  title: "Deploy Next.js app to Production",
  description: "Push code to main, trigger Vercel deployment, notify team",
  riskLevel: "high",
  targetSystem: "Vercel Production",
  actionType: "deploy",
  payload: {
    repo: "owner/repo",
    branch: "main",
    buildCommand: "npm run build",
  },
  status: "awaiting_approval",
}
```

### 5.2 User Approves or Rejects

```typescript
// POST /api/agents/proposals/[proposalId]/approve
{
  action: "approve",  // or "reject"
  notes: "Looks good, go ahead"
}
```

### 5.3 Server Executes or Cancels

```typescript
// If approved:
// (1) Find the payload in audit log
// (2) Rebuild agent runtime context
// (3) Execute the action (e.g., call agentProxy to deploy)
// (4) Update audit log: status = "approved" or "rejected"
// (5) Send notification to originating agent session (if async)
```

---

## 6. Tool Access Matrix

### By Agent Type

| Tool | Coding | Content | Ops | Research |
|:---|:---:|:---:|:---:|:---:|
| createSandbox | ✅ | ❌ | ❌ | ❌ |
| executeCommand | ✅ | ❌ | ❌ | ❌ |
| getSandboxPreview | ✅ | ❌ | ❌ | ❌ |
| agentProxy | ✅ | ✅ | ✅ | ❌ |
| createGitHubPR | ✅ | ❌ | ✅ | ❌ |
| createDocument | ✅ | ✅ | ✅ | ✅ |
| getDocuments | ✅ | ✅ | ✅ | ✅ |
| getTasks | ✅ | ✅ | ✅ | ✅ |
| createTask | ✅ | ✅ | ✅ | ❌ |
| updateTask | ✅ | ✅ | ✅ | ❌ |
| searchAuditLogs | ❌ | ❌ | ✅ | ✅ |
| proposeAction | ✅ | ✅ | ✅ | ❌ |
| getSecrets | ✅ | ❌ | ✅ | ❌ |

---

## 7. Error Handling & Fallback

### 7.1 Agent Tool Execution Errors

If a tool fails, the agent receives a structured error:

```typescript
{
  error: true,
  code: "integration_not_found",
  message: "No GitHub integration found for this project",
  resourceId: "proj_123",
  suggestion: "Connect GitHub in Project Settings → Integrations"
}
```

### 7.2 Agent Catches and Responds

```typescript
const result = await agentProxy(...);
if (result.error) {
  // Agent decides: retry, propose alternative, or escalate
  await proposeAction({
    title: "Manual GitHub Action Required",
    description: `Cannot find GitHub integration: ${result.message}`,
    riskLevel: "high",
  });
}
```

---

## 8. Audit Trail

Every agent tool execution is logged:

```typescript
// Example audit log entry
{
  organizationId: "org_123",
  action: "agent_proxy_call",
  resourceType: "integration",
  resourceId: "integ_github_456",
  metadata: {
    agentType: "coding",
    agentSessionId: "sess_789",
    service: "github",
    method: "POST",
    path: "/repos/owner/repo/pulls",
    statusCode: 201,
  },
  actorType: "agent",
  ipAddress: "0.0.0.0",  // Agent server IP
  createdAt: "2024-06-15T10:30:00Z",
}
```

---

## 9. Implementation Checklist

- [x] Agent Proxy Tool exists & working (agent-proxy.ts)
- [x] Propose Action Tool exists (propose-action.ts)
- [x] Agent Session model exists (AgentSession table)
- [x] Tool registry pattern established (lib/ai/tools/)
- [ ] Explicit Proposal model (currently in AuditLog metadata)
- [ ] Approval endpoint (/api/agents/proposals/[id]/approve)
- [ ] Agent context builder (buildAgentRuntimeContext)
- [ ] Tool access control by agent type
- [ ] Agent error recovery flow
- [ ] Async agent execution (agents work in background)

