# Task 1: Extend ActionProposal Service - Technical Specification

**Effort**: 4 hours  
**Files**: `lib/services/proposals.ts`  
**Status**: Ready for implementation  

---

## Overview

Extend the existing `proposals.ts` service to add action execution logic. The service will route proposals by `actionType` to appropriate handlers, decrypt credentials, and execute via vault proxy pattern.

---

## Current State

**Location**: `lib/services/proposals.ts` (326 LOC)

**Existing functions**:
- `toProposalDto()` — Convert Prisma model to DTO
- `createProposal()` — Create new proposal
- `getProposal()` — Get by ID
- `listProposals()` — List with filters
- `listPendingProposals()` — List awaiting_approval
- `approveProposal()` — Mark approved
- `rejectProposal()` — Mark rejected
- `markProposalExecuted()` — Mark executed
- `markProposalFailed()` — Mark failed

**What's missing**:
- `getProposalOrThrow()` helper
- `executeProposal()` main executor
- Handlers for each action type (deploy, publish, etc)

---

## New Functions to Add

### 1. getProposalOrThrow()

```typescript
/**
 * Get a proposal or throw NotFound error
 * Org-scoped: verifies project belongs to organization
 */
export async function getProposalOrThrow(
  proposalId: string,
  organizationId: string
): Promise<ActionProposal> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: proposalId,
      project: { organizationId },
    },
    include: {
      agentSession: true,
      createdBy: { select: { id: true, email: true } },
      approvedBy: { select: { id: true, email: true } },
    },
  })

  if (!proposal) {
    throw notFound("Proposal not found")
  }

  return proposal
}
```

**Purpose**: Used by approve/execute endpoints to safely fetch proposal

**Pattern**: See `getTaskOrThrow` in `lib/services/tasks.ts`

---

### 2. executeProposal()

```typescript
export type ExecutionResult = {
  success: boolean
  message: string
  result?: Record<string, unknown>
  error?: string
  executedAt: Date
}

/**
 * Execute a proposal's action
 * 
 * Flow:
 * 1. Verify proposal is in approved state
 * 2. Get integration for target system
 * 3. Route by actionType to handler
 * 4. Handler decrypts credentials, makes API call
 * 5. Save result to proposal metadata
 * 6. Log to audit trail
 */
export async function executeProposal(input: {
  ctx: AuthContext
  proposalId: string
}): Promise<ExecutionResult> {
  // 1. Get proposal
  const proposal = await getProposalOrThrow(
    input.proposalId,
    input.ctx.organizationId!
  )

  // 2. Verify it's approved
  if (proposal.status !== "approved") {
    throw forbidden("Proposal is not in approved state")
  }

  try {
    // 3. Get project to access integrations
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: proposal.projectId },
    })

    // 4. Route by actionType
    let result: ExecutionResult

    switch (proposal.actionType) {
      case "deploy":
        result = await executeDeployAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "publish":
        result = await executePublishAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "delete":
        result = await executeDeleteAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "rotate_secret":
        result = await executeRotateSecretAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      default:
        throw badRequest(`Unknown action type: ${proposal.actionType}`)
    }

    // 5. Save result to metadata
    const updated = await prisma.actionProposal.update({
      where: { id: proposal.id },
      data: {
        metadata: {
          ...((proposal.metadata as Record<string, unknown>) ?? {}),
          executionResult: {
            success: result.success,
            message: result.message,
            result: result.result,
            error: result.error,
            executedAt: result.executedAt.toISOString(),
          },
        },
      },
    })

    // 6. Audit log
    await writeAuditLog({
      ctx: input.ctx,
      organizationId: input.ctx.organizationId!,
      action: "agent_proxy_call",
      resourceType: "action_proposal",
      resourceId: proposal.id,
      metadata: {
        actionType: proposal.actionType,
        success: result.success,
        message: result.message,
      },
    })

    return result
  } catch (error) {
    // On error, update proposal metadata with error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    await prisma.actionProposal.update({
      where: { id: proposal.id },
      data: {
        metadata: {
          ...((proposal.metadata as Record<string, unknown>) ?? {}),
          executionResult: {
            success: false,
            error: errorMessage,
            executedAt: new Date().toISOString(),
          },
        },
      },
    })

    throw error
  }
}
```

**Pattern**: Similar to `agentProxyTool` but for server-side execution

**Key points**:
- Always verify `organizationId` (org-scoped)
- Always verify proposal status
- Store result in metadata (immutable audit trail)
- Log all attempts (success + failure)

---

### 3. Action Type Handlers

#### 3a. executeDeployAction()

```typescript
/**
 * Deploy action executor
 * 
 * Payload should contain:
 * - environment: "production" | "staging" | "development"
 * - ref: git branch/tag (e.g., "main")
 * - service: "vercel" | "netlify" (defaults to first available)
 */
async function executeDeployAction(
  proposal: ActionProposal & { agentSession?: AgentSession | null },
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const targetEnv = payload.environment as string ?? "production"
  const ref = payload.ref as string ?? "main"

  // 1. Get Vercel integration (most common)
  const vercelIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "vercel",
      enabled: true,
    },
  })

  if (!vercelIntegration) {
    return {
      success: false,
      message: "No Vercel integration found",
      error: "Vercel not connected",
      executedAt: new Date(),
    }
  }

  try {
    // 2. Decrypt token
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...vercelIntegration,
        project: { organizationId },
      },
      "access"
    )

    // 3. Call Vercel API to trigger deployment
    const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name,
        ref,
        environment: targetEnv,
        production: targetEnv === "production",
      }),
    })

    if (!vercelRes.ok) {
      const error = await vercelRes.json().catch(() => ({}))
      return {
        success: false,
        message: `Vercel API error: ${vercelRes.statusText}`,
        error: JSON.stringify(error),
        executedAt: new Date(),
      }
    }

    const deployment = await vercelRes.json()

    return {
      success: true,
      message: `Deployment triggered: ${deployment.url}`,
      result: {
        deploymentId: deployment.id,
        url: deployment.url,
        environment: targetEnv,
        ref,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Deployment failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}
```

**Payload format** (example):
```json
{
  "environment": "production",
  "ref": "main",
  "service": "vercel"
}
```

**Error cases**:
- No Vercel integration found → return friendly error
- API call fails → catch and return error details
- Invalid payload → validate before calling

---

#### 3b. executePublishAction()

```typescript
/**
 * Publish action executor
 * 
 * Publishes content to external system (CMS, newsletter, etc)
 * 
 * Payload:
 * - target: "slack" | "ghost" | "email"
 * - title: document title
 * - content: markdown or plain text
 */
async function executePublishAction(
  proposal: ActionProposal,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const target = payload.target as string ?? "slack"

  if (target === "slack") {
    return await executePublishToSlack(payload, project, organizationId)
  } else if (target === "ghost") {
    return await executePublishToGhost(payload, project, organizationId)
  } else {
    return {
      success: false,
      message: `Unknown publish target: ${target}`,
      error: "Invalid target",
      executedAt: new Date(),
    }
  }
}

/**
 * Publish to Slack channel
 */
async function executePublishToSlack(
  payload: Record<string, unknown>,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const slackIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "slack",
      enabled: true,
    },
  })

  if (!slackIntegration) {
    return {
      success: false,
      message: "No Slack integration found",
      error: "Slack not connected",
      executedAt: new Date(),
    }
  }

  try {
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...slackIntegration,
        project: { organizationId },
      },
      "access"
    )

    const title = payload.title as string ?? "New Update"
    const content = payload.content as string ?? ""
    const channel = payload.channel as string ?? "#general"

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${title}*\n${content}`,
            },
          },
        ],
      }),
    })

    if (!slackRes.ok) {
      const error = await slackRes.json().catch(() => ({}))
      return {
        success: false,
        message: `Slack API error: ${slackRes.statusText}`,
        error: JSON.stringify(error),
        executedAt: new Date(),
      }
    }

    const result = await slackRes.json()

    return {
      success: true,
      message: `Message posted to ${channel}`,
      result: {
        channel,
        timestamp: result.ts,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Slack publish failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}
```

**Payload format** (example):
```json
{
  "target": "slack",
  "title": "Newsletter #42",
  "content": "This week's updates...",
  "channel": "#announcements"
}
```

---

#### 3c. executeDeleteAction()

```typescript
/**
 * Delete action executor
 * 
 * Deletes a resource (GitHub branch, secret, document, etc)
 * 
 * Payload:
 * - resourceType: "github_branch" | "secret" | "document"
 * - resourceId: identifier for what to delete
 */
async function executeDeleteAction(
  proposal: ActionProposal,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const resourceType = payload.resourceType as string
  const resourceId = payload.resourceId as string

  if (!resourceType || !resourceId) {
    return {
      success: false,
      message: "Missing resourceType or resourceId",
      error: "Invalid payload",
      executedAt: new Date(),
    }
  }

  if (resourceType === "github_branch") {
    return await executeDeleteGitHubBranch(resourceId, project, organizationId)
  } else if (resourceType === "document") {
    return await executeDeleteDocument(resourceId, project, organizationId)
  } else if (resourceType === "secret") {
    return await executeDeleteSecret(resourceId, project, organizationId)
  } else {
    return {
      success: false,
      message: `Unknown resource type: ${resourceType}`,
      error: "Invalid resourceType",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a GitHub branch
 */
async function executeDeleteGitHubBranch(
  branchName: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const gitHubIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "github",
      enabled: true,
    },
  })

  if (!gitHubIntegration) {
    return {
      success: false,
      message: "No GitHub integration found",
      error: "GitHub not connected",
      executedAt: new Date(),
    }
  }

  try {
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...gitHubIntegration,
        project: { organizationId },
      },
      "access"
    )

    // Parse repository from integration metadata
    const repo = (gitHubIntegration.metadata as Record<string, any>)?.repo ?? ""
    const [owner, repoName] = repo.split("/")

    if (!owner || !repoName) {
      return {
        success: false,
        message: "GitHub repository not configured",
        error: "Invalid repository",
        executedAt: new Date(),
      }
    }

    const deleteRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )

    if (!deleteRes.ok && deleteRes.status !== 404) {
      return {
        success: false,
        message: `GitHub API error: ${deleteRes.statusText}`,
        error: await deleteRes.text(),
        executedAt: new Date(),
      }
    }

    return {
      success: true,
      message: `Branch '${branchName}' deleted`,
      result: {
        branch: branchName,
        deleted: true,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete branch failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a document from project
 */
async function executeDeleteDocument(
  documentId: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  try {
    const { deleteDocument } = await import("@/lib/services/documents")
    
    await deleteDocument({
      ctx: {
        userId: "system", // System action, not user-initiated
        organizationId,
      } as AuthContext,
      id: documentId,
    })

    return {
      success: true,
      message: `Document deleted`,
      result: { documentId, deleted: true },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete document failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a secret
 */
async function executeDeleteSecret(
  secretId: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  try {
    const { deleteSecret } = await import("@/lib/services/secrets")
    
    await deleteSecret({
      ctx: {
        userId: "system",
        organizationId,
      } as AuthContext,
      id: secretId,
    })

    return {
      success: true,
      message: `Secret deleted`,
      result: { secretId, deleted: true },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete secret failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}
```

---

#### 3d. executeRotateSecretAction()

```typescript
/**
 * Rotate secret action executor
 * 
 * Rotates a secret value (generates new random value, stores version)
 * 
 * Payload:
 * - secretId: secret to rotate
 * - type: "password" | "api_token" | "ssh_keypair"
 */
async function executeRotateSecretAction(
  proposal: ActionProposal,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const secretId = payload.secretId as string
  const type = (payload.type as string) ?? "password"

  if (!secretId) {
    return {
      success: false,
      message: "Missing secretId",
      error: "Invalid payload",
      executedAt: new Date(),
    }
  }

  try {
    // For now, just mark as rotated in audit log
    // Full secret rotation (generate new value) is Phase 1 feature
    
    return {
      success: true,
      message: `Secret marked for rotation`,
      result: {
        secretId,
        type,
        rotated: true,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Rotate secret failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}
```

---

## Integration Points

### 1. Update approve endpoint

**File**: `app/api/v1/projects/[projectId]/proposals/[proposalId]/approve/route.ts`

```typescript
// After approveProposal():
try {
  const result = await executeProposal({
    ctx: auth,
    proposalId: params.proposalId,
  })

  const executed = await markProposalExecuted(params.proposalId, org.organizationId)

  return json({
    data: executed,
    execution: result,
  })
} catch (error) {
  // Execution failed, but proposal is already approved
  // Mark as failed and return error
  await markProposalFailed(params.proposalId, org.organizationId, 
    error instanceof Error ? error.message : "Unknown error"
  )
  return handleRouteError(error)
}
```

### 2. Audit logging

Each execution (success/failure) is logged:

```typescript
await writeAuditLog({
  ctx: input.ctx,
  organizationId: input.ctx.organizationId!,
  action: "agent_proxy_call",
  resourceType: "action_proposal",
  resourceId: proposal.id,
  metadata: {
    actionType: proposal.actionType,
    success: result.success,
    targetSystem: proposal.targetSystem,
    message: result.message,
  },
})
```

---

## Error Handling

### Expected Errors

| Scenario | Response | Status |
|:---|:---|:---|
| Proposal not found | `notFound("Proposal not found")` | 404 |
| Not approved | `forbidden("Proposal is not in approved state")` | 403 |
| Integration not found | ExecutionResult with `success: false` | 200 |
| API call fails | ExecutionResult with error details | 200 |
| Invalid action type | `badRequest("Unknown action type")` | 400 |

### Key Points

- **Never crash** the endpoint — catch all errors
- **Always return** ExecutionResult (success flag + message)
- **Always log** to audit trail (success + failure)
- **Save errors** to proposal.metadata for UI display

---

## Testing Strategy

### Unit Tests

```typescript
describe("executeProposal()", () => {
  test("deploys to Vercel with correct payload", async () => {
    // Mock Vercel API
    // Create proposal with deploy action type
    // Call executeProposal()
    // Verify API called with correct token
    // Verify result saved to metadata
  })

  test("publishes to Slack channel", async () => {
    // Mock Slack API
    // Create proposal with publish action
    // Call executeProposal()
    // Verify message posted
  })

  test("deletes GitHub branch", async () => {
    // Mock GitHub API
    // Create proposal with delete action
    // Call executeProposal()
    // Verify branch deletion call
  })

  test("returns error if integration missing", async () => {
    // Create proposal but no integration
    // Call executeProposal()
    // Verify returns ExecutionResult with success: false
  })

  test("saves error to metadata on failure", async () => {
    // Mock API to fail
    // Call executeProposal()
    // Verify proposal.metadata.executionResult.error is set
  })
})
```

### Integration Tests

See `__tests__/approval-workflow.integration.test.ts` (Task 7)

---

## Performance Considerations

| Operation | Expected Time |
|:---|:---|
| `getProposalOrThrow()` | <10ms (DB lookup) |
| `executeProposal()` routing | <5ms (switch statement) |
| External API call (Vercel, GitHub, Slack) | 100-2000ms |
| Save result to metadata | <20ms (DB write) |
| Audit log write | <10ms (DB insert) |

**Total**: ~200-2100ms per execution

**Optimization**: Move to background queue (Phase 1)

---

## Deployment Checklist

- [ ] Functions added to `lib/services/proposals.ts`
- [ ] Errors imported: `badRequest`, `forbidden`
- [ ] Integrations service imported and tested
- [ ] All action types have handlers
- [ ] Audit logging added to each handler
- [ ] Error messages are user-friendly
- [ ] Unit tests passing
- [ ] Integration endpoint updated (`app/api/.../approve/route.ts`)
- [ ] Manual testing in dev environment
- [ ] Ready for Phase 1 (async queue)

