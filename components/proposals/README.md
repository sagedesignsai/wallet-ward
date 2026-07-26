# Action Proposals - Human-in-the-Loop Approval System

**Status**: ✅ Complete  
**Phase**: 0 (MVP Foundation)  
**Version**: 1.0.0  

---

## Overview

The Action Proposals system enables **Human-in-the-Loop (HITL) approval** for high-risk agent actions. Agents can propose actions like deployments, publishing, or deletions, which require human review before execution.

### Key Features

✅ **Zero Credential Leaks** - Vault proxy pattern, credentials never exposed  
✅ **Immutable Audit Trail** - Every action logged permanently  
✅ **Org-Scoped Security** - All operations isolated by organization  
✅ **Agent Polling** - Agents can check approval status and continue  
✅ **Tool Access Control** - Agent types restricted to appropriate tools  
✅ **Real-Time Execution** - Actions execute immediately upon approval  

---

## Architecture

```
Agent Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. Agent proposes action (proposeActionTool)           │
│    └─> Creates ActionProposal (awaiting_approval)      │
│                                                         │
│ 2. UI renders approval card                            │
│    └─> Human reviews details, risk level, payload      │
│                                                         │
│ 3. Human approves/rejects                              │
│    └─> POST /api/.../proposals/.../approve             │
│                                                         │
│ 4. Server executes action                              │
│    └─> Decrypts credentials (vault proxy)              │
│    └─> Routes by actionType to handler                 │
│    └─> Calls external API (Vercel, Slack, GitHub)      │
│                                                         │
│ 5. Agent polls for status                              │
│    └─> GET /api/agents/sessions/.../pending-proposals  │
│    └─> Sees approved/executed status                   │
│                                                         │
│ 6. Agent continues workflow                            │
│    └─> Proceeds with next step                         │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### Backend

#### Services
- **`lib/services/proposals.ts`** - Core proposal management
  - `createProposal()` - Create new proposal
  - `approveProposal()` - Mark as approved
  - `rejectProposal()` - Mark as rejected
  - `executeProposal()` - Execute action (router)
  - `markProposalExecuted()` - Mark as completed
  - `markProposalFailed()` - Mark as failed

#### Action Handlers
- `executeDeployAction()` - Deploy to Vercel
- `executePublishAction()` - Publish to Slack/Ghost
- `executeDeleteAction()` - Delete (GitHub branch, document, secret)
- `executeRotateSecretAction()` - Rotate secret (Phase 1)

#### API Endpoints
- `POST /api/v1/projects/:projectId/proposals` - Create proposal
- `GET /api/v1/projects/:projectId/proposals` - List proposals
- `GET /api/v1/projects/:projectId/proposals/:proposalId` - Get one
- `POST /api/v1/projects/:projectId/proposals/:proposalId/approve` - Approve & execute
- `POST /api/v1/projects/:projectId/proposals/:proposalId/reject` - Reject
- `GET /api/agents/sessions/:sessionId/pending-proposals` - Agent polling

### Frontend

#### Components
- **`ApprovalCard`** - Display proposal with approve/reject buttons
- **`ProposalModal`** - Full-page modal for detailed review
- **`RiskBadge`** - Color-coded risk level indicator

#### Hooks
- **`useProposals`** - Fetch proposals, approve, reject

#### Pages
- **`/dashboard/proposals`** - List all proposals with filters

---

## Usage

### Agent Proposes Action

```typescript
// Agent calls tool
await proposeAction({
  projectId: "proj_123",
  title: "Deploy main to production",
  description: "Deploy latest code to production environment",
  riskLevel: "high",
  actionType: "deploy",
  targetSystem: "Vercel Production",
  payload: {
    environment: "production",
    ref: "main"
  }
})

// Returns: { proposalId: "prop_xyz", status: "awaiting_approval" }
```

### Human Approves

```typescript
// POST /api/v1/projects/proj_123/proposals/prop_xyz/approve
const response = await fetch("/api/.../approve", {
  method: "POST",
  body: JSON.stringify({ notes: "Looks good!" })
})

// Returns:
// {
//   data: { ...proposal, status: "executed" },
//   execution: { success: true, message: "Deployed to ..." }
// }
```

### Agent Checks Status

```typescript
// Agent polls for updates
const result = await getPendingProposals({
  sessionId: "agent_session_123"
})

// Returns proposals grouped by status:
// {
//   awaiting: [],
//   approved: [],
//   rejected: [],
//   executed: [{ id: "prop_xyz", executionResult: {...} }],
//   failed: []
// }
```

---

## Action Types

| Type | Handler | Services | Restricted To |
|:---|:---|:---|:---|
| `deploy` | `executeDeployAction` | Vercel | coding, ops |
| `publish` | `executePublishAction` | Slack, Ghost | coding, ops, content |
| `delete` | `executeDeleteAction` | GitHub, DB | coding, ops |
| `rotate_secret` | `executeRotateSecretAction` | Vault | coding, ops |

---

## Risk Levels

| Level | Use Case | Color |
|:---|:---|:---|
| `low` | Create document, send notification | Green |
| `medium` | Deploy to staging, create task | Yellow |
| `high` | Deploy to production, delete resource | Orange |
| `critical` | Delete database, rotate production secrets | Red |

---

## Tool Access Control

```typescript
// lib/ai/tool-access.ts
const TOOL_ACCESS_MATRIX = {
  // Sandboxes (coding only)
  createSandbox: ["coding"],
  executeCommand: ["coding"],
  
  // Deployments (coding + ops)
  triggerVercelDeploy: ["coding", "ops"],
  createGithubPullRequest: ["coding", "ops"],
  
  // Secrets (coding + ops only, NOT content/research)
  getSecrets: ["coding", "ops"],
  
  // Documents (content + ops + research)
  createDocument: ["content", "ops", "research"],
  
  // Tasks (ops + research)
  createTask: ["ops", "research"],
  getTasks: ["ops", "research"],
  
  // Proposals (all)
  proposeAction: ["coding", "ops", "content", "research"],
  getPendingProposals: ["coding", "ops", "content", "research"],
}
```

---

## Security

### Vault Proxy Pattern

```typescript
// Agent CANNOT do this:
const token = await getSecretValue("vercel_token") // ❌ Tool doesn't exist

// Agent CAN do this:
const result = await agentProxy({
  projectId: "proj_123",
  service: "vercel",
  method: "POST",
  path: "/deployments",
  body: { ... }
})
// ✅ Server decrypts token, injects into request, agent never sees it
```

### Org-Scoping

Every query verifies:
```typescript
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId: auth.organizationId // ✅ Always checked
  }
})
```

### Audit Trail

Every state change logged:
```typescript
await writeAuditLog({
  ctx: auth,
  organizationId: auth.organizationId,
  action: "agent_proxy_call",
  resourceType: "action_proposal",
  resourceId: proposal.id,
  metadata: { actionType, success, message }
})
```

---

## Database Schema

```prisma
model ActionProposal {
  id             String   @id @default(cuid())
  projectId      String
  agentSessionId String?
  createdById    String?
  
  title          String
  description    String
  riskLevel      ProposalRiskLevel  // low, medium, high, critical
  actionType     String              // deploy, publish, delete, rotate_secret
  targetSystem   String
  
  status         ProposalStatus      // awaiting_approval, approved, rejected, executed, failed
  payload        Json
  metadata       Json?               // Execution result stored here
  
  approvedById   String?
  approvalNotes  String?
  rejectionNotes String?
  
  executedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  project        Project   @relation(...)
  agentSession   AgentSession? @relation(...)
  createdBy      User?     @relation(...)
  approvedBy     User?     @relation(...)
}
```

---

## Testing

### Integration Tests

```bash
npm run test -- approval-workflow.integration.test.ts
```

Tests cover:
1. ✅ Agent proposes action
2. ✅ Human approves
3. ✅ Action executes
4. ✅ Agent polls status
5. ✅ Rejection flow
6. ✅ Audit trail
7. ✅ Security & permissions
8. ✅ Error handling

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to /dashboard/proposals
# 3. Select a project
# 4. Create proposal (via agent or API)
# 5. Click "Approve" or "Reject"
# 6. Verify execution result
# 7. Check audit logs
```

---

## Performance

| Operation | Time | Notes |
|:---|---:|:---|
| Create proposal | <50ms | DB insert + audit log |
| Approve proposal | 200-3000ms | Includes execution |
| Poll proposals | <100ms | DB query |
| Execute deploy | 500-2000ms | External API call |
| Execute publish | 300-1000ms | Slack/Ghost API |

---

## Known Limitations (Phase 0)

1. **Synchronous execution** - Actions block HTTP response (30s timeout)
2. **No background queue** - Can't handle long-running tasks (>30s)
3. **No webhooks** - Agents must poll (every 2-5s recommended)
4. **No execution history** - Only latest result in metadata
5. **Limited actions** - 4 types only (deploy, publish, delete, rotate)

### Coming in Phase 1

- ✨ Background queue (Bull/pg-boss)
- ✨ Webhook notifications for agents
- ✨ Full execution history
- ✨ More action types
- ✨ Auto-retry failed actions
- ✨ Rate limiting

---

## Troubleshooting

### Proposal stuck in "awaiting_approval"
→ Refresh UI, check if human approved but execution failed

### Execution fails with "No integration found"
→ Connect integration in `/dashboard/integrations`

### Agent can't use tool
→ Check `tool-access.ts` matrix for agent type restrictions

### Credentials leaked in response
→ Should never happen! File bug report immediately

---

## Files Reference

**Services**: `lib/services/proposals.ts` (850 LOC)  
**Tools**: `lib/ai/tools/propose-action.ts`, `get-pending-proposals.ts`  
**Components**: `components/proposals/*.tsx`  
**Hooks**: `hooks/use-proposals.ts`  
**Pages**: `app/dashboard/proposals/page.tsx`  
**Tests**: `__tests__/approval-workflow.integration.test.ts`  
**Access Control**: `lib/ai/tool-access.ts`  

---

## Contributing

When adding new action types:

1. Add handler in `lib/services/proposals.ts`
2. Add to `executeProposal()` switch statement
3. Update `ACTION_TYPE_LABELS` in UI
4. Add test case in integration tests
5. Document in this README

---

**Last Updated**: 2026-07-26  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
