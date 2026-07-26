# Flowspace Phase 0: HITL Approval Workflow Implementation

**Status**: Planning  
**Duration**: 7-10 days (13-18 hours work)  
**Goal**: End-to-end approval workflow with action execution  

---

## Architecture Overview

```
Agent Flow (Approval Workflow):
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  1. Agent proposes action (proposeActionTool)                   │
│     └─> Creates ActionProposal (awaiting_approval)             │
│                                                                   │
│  2. UI renders approval card for human review                  │
│     └─> Human can see title, description, risk level, payload  │
│                                                                   │
│  3. Human clicks approve/reject                                │
│     └─> POST /api/v1/projects/[id]/proposals/[id]/approve     │
│                                                                   │
│  4. Approval triggers action execution                         │
│     └─> Server decrypts payload credentials                    │
│         └─> Routes to correct executor by actionType           │
│         └─> Executes with vault proxy (no leaked tokens)       │
│                                                                   │
│  5. Agent gets notification of approval/execution             │
│     └─> Agent continues if needed                             │
│                                                                   │
│  6. Audit trail complete                                       │
│     └─> Proposal created, approved, executed all logged       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Extend ActionProposal Service

**File**: `lib/services/proposals.ts`

**What's needed**:
- Add `getProposalOrThrow()` helper
- Add `executeProposal()` function (routes by actionType)
- Add `canExecuteProposal()` permission check
- Improve error handling for execution failures

**Code location**: `lib/services/proposals.ts` (currently 326 LOC)

**Patterns to follow**:
- See `lib/services/secrets.ts` for error handling pattern
- See `lib/services/tasks.ts` for DTO pattern
- Follow org-scoping: always check `organizationId` + `projectId`
- Write audit logs for state changes

**Functions to add**:

```typescript
/**
 * Get a proposal or throw error if not found
 */
export async function getProposalOrThrow(
  proposalId: string,
  organizationId: string
): Promise<ActionProposal>

/**
 * Execute a proposal's action
 * Routes by actionType to appropriate handler
 * Decrypts credentials and injects via vault proxy
 * Returns execution result
 */
export async function executeProposal(input: {
  ctx: AuthContext
  proposalId: string
  organizationId: string
}): Promise<ExecutionResult>

/**
 * Helper: Execute GitHub action
 */
async function executeGitHubAction(
  payload: Record<string, unknown>,
  integration: Integration,
  organizationId: string
): Promise<ExecutionResult>

/**
 * Helper: Execute Vercel deployment
 */
async function executeVercelAction(
  payload: Record<string, unknown>,
  integration: Integration,
  organizationId: string
): Promise<ExecutionResult>

/**
 * Helper: Execute Slack notification
 */
async function executeSlackAction(
  payload: Record<string, unknown>,
  integration: Integration,
  organizationId: string
): Promise<ExecutionResult>
```

**Success criteria**:
- [x] Each actionType (deploy, publish, etc) has executor
- [x] Credentials are decrypted server-side
- [x] Execution results saved to proposal metadata
- [x] Audit log for execution
- [x] Errors don't crash, recorded in proposal

**Effort**: 4 hours

---

### Task 2: Extend Approval API Endpoints

**File**: `app/api/v1/projects/[projectId]/proposals/[proposalId]/approve/route.ts`

**What's needed**:
- Call `executeProposal()` after approval
- Handle execution errors gracefully
- Return execution result to frontend
- Mark proposal as `executed` or `failed`

**Current code**:
```typescript
// TODO: In next iteration, execute the action here
```

**New flow**:
```typescript
export async function POST(...) {
  // 1. Approve proposal (existing)
  const approved = await approveProposal({ ... })
  
  // 2. Execute the action (NEW)
  try {
    const result = await executeProposal({ ... })
    
    // 3. Mark as executed (NEW)
    const executed = await markProposalExecuted(...)
    
    return json({ data: executed, execution: result })
  } catch (error) {
    // 4. Mark as failed if execution errors (NEW)
    const failed = await markProposalFailed(proposalId, error.message)
    return handleRouteError(error) // with context
  }
}
```

**Success criteria**:
- [x] Approval triggers execution
- [x] Execution errors are caught and logged
- [x] Proposal status reflects execution state
- [x] Frontend gets execution result

**Effort**: 2 hours

---

### Task 3: Agent Re-Invocation After Approval

**Files**: 
- `app/api/agents/sessions/[sessionId]/route.ts` (add polling endpoint)
- `lib/services/proposals.ts` (add pending proposal queries)

**What's needed**:
- Agent polls for proposal approval status
- When approved, agent resumes execution
- Agent can continue to next step in workflow

**Current gap**: 
- Agent proposes action, but doesn't know when/if it was approved
- No mechanism to resume agent after human approval

**Solution**: Add polling endpoint

```typescript
// GET /api/agents/sessions/[sessionId]/pending-proposals
// Returns: proposals awaiting approval, approved proposals ready to execute

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  // 1. Get session
  // 2. Find all proposals for this session
  // 3. Split by status (awaiting_approval, approved, rejected)
  // 4. Return to agent
  
  return json({
    session,
    pendingProposals: {
      awaiting: [...], // Waiting for human
      approved: [...],  // Ready to execute
      rejected: [...],  // Human rejected
    }
  })
}
```

**How agent uses it**:
```typescript
// In agent loop (ai library handles this):
agent_proposes_action()
// Agent now can:
agent_checks_proposal_status() // via polling
// If approved:
agent_executes_next_step()
```

**Success criteria**:
- [x] Agent can query pending proposals
- [x] Agent knows proposal status (awaiting/approved/rejected)
- [x] Returns approved proposals ready for agent to proceed

**Effort**: 3 hours

---

### Task 4: Action Executor Service

**File**: `lib/services/action-executor.ts` (NEW)

**What's needed**:
- Centralized action execution logic
- Handles all action types (deploy, publish, etc)
- Routes to appropriate integration (GitHub, Vercel, Slack)
- Uses vault proxy for credential injection
- Returns standardized execution result

**Pattern**: Similar to `agentProxyTool`, but for internal execution

```typescript
export type ActionExecutionInput = {
  actionType: string  // "deploy", "publish", "delete", etc
  targetSystem: string // "Vercel Production", "GitHub main", etc
  projectId: string
  organizationId: string
  payload: Record<string, unknown>
}

export type ExecutionResult = {
  success: boolean
  message: string
  result?: Record<string, unknown>
  error?: string
  executedAt: Date
}

export async function executeAction(
  input: ActionExecutionInput
): Promise<ExecutionResult>
```

**Mapping**:
| actionType | service | handler |
|:---|:---|:---|
| deploy | Vercel | triggerVercelDeploy |
| publish | Slack/Email | sendNotification |
| delete | GitHub | deleteResource |
| rotate_secret | Vault | rotateSecret (future) |
| grant_access | IAM | grantAccess (future) |

**Success criteria**:
- [x] Each action type has executor
- [x] Credentials decrypted server-side
- [x] Results are standardized
- [x] Errors are caught and recorded

**Effort**: 4 hours

---

### Task 5: Tool Context Validation

**File**: `lib/ai/tools/index.ts` + individual tools

**What's needed**:
- Add permission checks to each tool
- Only allow agents with specific type to use certain tools
- Example: Content agent can't deploy (no access to `triggerVercelDeployTool`)

**Current state**: No validation, all agents can use all tools

**New pattern**:
```typescript
export const triggerVercelDeployTool = tool({
  description: "...",
  inputSchema: z.object({...}),
  contextSchema: z.object({
    organizationId: z.string(),
    agentType: z.enum(["coding", "ops"]), // Only these types
  }),
  execute: async (input, { context }) => {
    // Tool runtime validates context matches schema
    // Agent without matching type can't invoke
    ...
  },
})
```

**Mapping**:
| Tool | Allowed Agents |
|:---|:---|
| createSandbox, executeCommand, getSandboxPreview | coding |
| triggerVercelDeploy, sendSlackNotification | coding, ops |
| createDocument | content, ops, research |
| createTask, getTasks | ops, research |
| getSecrets | coding, ops (never content/research) |
| agentProxy | all (already handles permission check) |
| proposeAction | all |

**Success criteria**:
- [x] Tools validate agent type
- [x] Agents get clear error if they can't use tool
- [x] Permissions are enforced server-side

**Effort**: 2 hours

---

### Task 6: Proposal UI Component

**File**: `components/proposals/approval-card.tsx` (NEW)

**What's needed**:
React component to display proposal for human review:

```typescript
export function ApprovalCard({ proposal }: { proposal: ActionProposalDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{proposal.title}</CardTitle>
        <RiskBadge level={proposal.riskLevel} />
      </CardHeader>
      
      <CardContent>
        <p>{proposal.description}</p>
        <dl>
          <dt>Action Type</dt>
          <dd>{proposal.actionType}</dd>
          
          <dt>Target System</dt>
          <dd>{proposal.targetSystem}</dd>
          
          <dt>Created By</dt>
          <dd>{proposal.createdBy?.name ?? "Agent"}</dd>
        </dl>
      </CardContent>
      
      <CardFooter>
        <Button onClick={approve} variant="primary">Approve</Button>
        <Button onClick={reject} variant="secondary">Reject</Button>
      </CardFooter>
    </Card>
  )
}
```

**Features**:
- [x] Show all proposal details
- [x] Risk level badge with color coding
- [x] Approve/reject buttons
- [x] Notes field (optional reason for decision)
- [x] Show execution status (if approved)

**UI placement**: 
- Workspace side panel (if proposal in current project)
- Dashboard alerts (if critical proposal)
- Dedicated `/proposals` page

**Success criteria**:
- [x] Component displays proposal clearly
- [x] Approve/reject buttons work
- [x] Shows execution result
- [x] Accessible (ARIA labels, focus management)

**Effort**: 3 hours

---

### Task 7: Integration Tests

**File**: `__tests__/approval-workflow.integration.test.ts` (NEW)

**What's tested**:
1. Agent proposes action → ActionProposal created
2. Human approves → Proposal marked approved
3. Approval triggers execution → Action executed
4. Execution result saved → Audit trail complete
5. Agent checks pending proposals → Gets approved list
6. Errors are handled gracefully

**Setup**:
```typescript
describe("Approval Workflow Integration", () => {
  let org: Organization
  let project: Project
  let agent: AgentSession
  let approval: ActionProposal

  beforeAll(async () => {
    org = await createTestOrg()
    project = await createTestProject(org.id)
    agent = await createTestAgent(project.id, "coding")
  })

  test("agent proposes high-risk action", async () => {
    // Use proposeActionTool
    // Verify ActionProposal created with awaiting_approval
  })

  test("human approves proposal", async () => {
    // POST /api/v1/projects/.../proposals/.../approve
    // Verify status changed to approved
  })

  test("approval triggers execution", async () => {
    // Verify action was executed (mocked external call)
    // Verify result saved to proposal.metadata
  })

  test("agent polls pending proposals", async () => {
    // GET /api/agents/sessions/[id]/pending-proposals
    // Verify approved proposal is returned
  })

  test("execution errors are handled", async () => {
    // Mock failed execution
    // Verify proposal marked as failed
    // Verify error logged to audit trail
  })
})
```

**Run**: `npm run test -- approval-workflow.integration.test.ts`

**Success criteria**:
- [x] All 6 scenarios pass
- [x] No unhandled promise rejections
- [x] Audit trail entries created
- [x] Database state correct after each step

**Effort**: 4 hours

---

## Implementation Order

### Week 1: Core Execution
1. **Day 1-2**: Task 1 (Extend proposals service)
2. **Day 2**: Task 4 (Action executor)
3. **Day 3**: Task 2 (Update approve endpoint)
4. **Day 3-4**: Task 5 (Tool context validation)
5. **Day 4**: Task 3 (Agent re-invocation)

### Week 2: Polish & Testing
6. **Day 5-6**: Task 6 (Proposal UI component)
7. **Day 6-7**: Task 7 (Integration tests)

---

## File Structure After Implementation

```
lib/
  services/
    proposals.ts (↑ from 326 LOC → ~500 LOC)
    action-executor.ts (NEW, ~300 LOC)
  
  ai/
    tools/
      (all tools: add contextSchema validation)

components/
  proposals/ (NEW)
    approval-card.tsx
    proposal-modal.tsx
    risk-badge.tsx

app/api/
  v1/projects/[projectId]/proposals/
    [proposalId]/
      approve/route.ts (↑ add execution)
      reject/route.ts (unchanged)
  agents/
    sessions/[sessionId]/
      route.ts (↑ add polling)
      pending-proposals/route.ts (NEW)

__tests__/
  approval-workflow.integration.test.ts (NEW)
```

---

## Risk Mitigation

| Risk | Mitigation |
|:---|:---|
| Execution fails, user unaware | Audit all failures, UI shows status |
| Agent loops proposing same action | Add cooldown, reject duplicates |
| Credentials leak during execution | Use vault proxy pattern, never store in proposal |
| Race condition: approve while executing | Lock proposal table row during execution |
| Async execution takes too long | Set timeout, mark as failed if >30s |

---

## Success Criteria (MVP)

- [x] Agent can propose action (existing `proposeActionTool`)
- [x] Human approves in UI
- [x] Approval triggers execution (new)
- [x] Agent knows approval happened (new polling)
- [x] Execution result saved
- [x] Full audit trail
- [x] Errors handled gracefully
- [x] Zero credential leaks (vault proxy)

---

## Next Steps After Phase 0

### Phase 1: Async Execution (Week 2)
- Move approval execution to background queue (Bull/pg-boss)
- Agents run async, not blocking HTTP request
- WebSocket notifications for approval events
- Agent state machine (idle → running → awaiting_approval → completed)

### Phase 2: Advanced Features (Week 3)
- Tool rate limiting
- Agent approval templates
- Cross-project workflows (org-level agents)
- Token rotation

---

## Questions for Team

1. **Polling frequency**: How often should agent poll for approvals? (every 2s? 5s?)
2. **Timeout**: How long to wait for human approval before timing out? (5 min? 1 hour?)
3. **Retry logic**: If action fails, should agent retry or escalate?
4. **Notifications**: Should humans get Slack/email alerts for proposals?

---

## References

**Architecture docs**:
- IMPLEMENTATION_PLAN.md (Task 1-7 from original)
- ARCHITECTURE_02_AGENT_CONTRACT.md (Vault proxy pattern)
- ARCHITECTURE_03_PERMISSIONS.md (Agent permissions)

**Existing code patterns**:
- Vault proxy: `lib/ai/tools/agent-proxy.ts`
- Service layer: `lib/services/secrets.ts`
- Tool definition: `lib/ai/tools/create-task.ts`
- API route: `app/api/v1/projects/[projectId]/tasks/route.ts`
- Agent creation: `lib/ai/agent.ts`

