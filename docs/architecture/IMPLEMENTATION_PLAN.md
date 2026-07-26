# Flowspace Implementation Plan: Phase 0 (Foundation)

## Overview

This sprint focuses on **implementing the approval workflow**, the critical missing piece between agent autonomy and human control.

**Duration**: 1-2 weeks  
**Goal**: Agent can propose high-risk actions, human can approve/reject, actions execute with full audit trail

---

## Sprint Scope

### What We're Building This Sprint

```
┌────────────────────────────────────────────────────────┐
│              APPROVAL WORKFLOW                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│ Agent proposes action (existing: proposeActionTool)   │
│          ↓                                              │
│ ActionProposal created (NEW: database entity)          │
│          ↓                                              │
│ Audit log entry created (existing)                    │
│          ↓                                              │
│ UI renders approval card (NEW: React component)        │
│          ↓                                              │
│ Human approves/rejects (NEW: endpoints)                │
│          ↓                                              │
│ Action executes or is rejected (NEW: execution logic)  │
│          ↓                                              │
│ Audit trail completed                                  │
└────────────────────────────────────────────────────────┘
```

### What We're NOT Building This Sprint

- ❌ Async agent execution (agents still run synchronously)
- ❌ Org-level agents (project-scoped only)
- ❌ Token rotation (manual re-connect required)
- ❌ HSM/KMS integration (app-level key wrapping)
- ❌ SIEM forwarding (DB-only audit logs)

---

## Task Breakdown

### Task 1: Create ActionProposal Schema

**File**: `prisma/schema.prisma`

**Add model**:
```typescript
model ActionProposal {
  id             String    @id @default(cuid())
  projectId      String    @map("project_id")
  agentSessionId String?   @map("agent_session_id")  // null for human-proposed
  createdById    String?   @map("created_by_id")     // null for agent-created
  
  title          String
  description    String
  riskLevel      String    @default("medium")  // "low"|"medium"|"high"|"critical"
  actionType     String                        // "deploy"|"publish"|"delete"|etc
  targetSystem   String                        // "Vercel Production", "GitHub main", etc
  
  status         String    @default("awaiting_approval")  // "awaiting_approval"|"approved"|"rejected"|"executed"
  
  payload        Json                          // Action arguments (credentials injected server-side)
  
  approvedById   String?   @map("approved_by_id")
  approvalNotes  String?   @map("approval_notes")
  rejectionNotes String?   @map("rejection_notes")
  
  executedAt     DateTime? @map("executed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  project        Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentSession   AgentSession? @relation(fields: [agentSessionId], references: [id], onDelete: SetNull)
  createdBy      User?      @relation("ProposalCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  approvedBy     User?      @relation("ProposalApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([status])
  @@index([createdAt])
  @@map("action_proposal")
}

// Update existing models:
model AgentSession {
  // ... existing fields ...
  proposals ActionProposal[]
}

model User {
  // ... existing fields ...
  proposalsCreated ActionProposal[] @relation("ProposalCreatedBy")
  proposalsApproved ActionProposal[] @relation("ProposalApprovedBy")
}
```

**Effort**: 1 hour (schema + migration)

**Checklist**:
- [ ] Schema added to prisma.prisma
- [ ] Migration created: `npx prisma migrate dev --name add_action_proposal`
- [ ] Types generated: `npx prisma generate`
- [ ] Verified in DB

---

### Task 2: Create ActionProposal Service Layer

**File**: `lib/services/proposals.ts` (NEW)

**Implement**:
```typescript
import { prisma } from "@/lib/db"
import { notFound, forbidden } from "@/lib/api/errors"
import { writeAuditLog } from "@/lib/services/audit"
import type { AuthContext } from "@/lib/api/auth"

export type ActionProposalDto = {
  id: string
  projectId: string
  agentSessionId: string | null
  title: string
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
  actionType: string
  targetSystem: string
  status: "awaiting_approval" | "approved" | "rejected" | "executed"
  payload: Record<string, unknown>
  approvedById: string | null
  approvalNotes: string | null
  rejectionNotes: string | null
  executedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function createProposal(input: {
  ctx: AuthContext
  projectId: string
  agentSessionId?: string
  title: string
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
  actionType: string
  targetSystem: string
  payload?: Record<string, unknown>
}): Promise<ActionProposalDto> {
  // Verify project exists in org
  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId: input.ctx.organizationId,
    },
  })
  if (!project) throw notFound("Project not found")

  const proposal = await prisma.actionProposal.create({
    data: {
      projectId: input.projectId,
      agentSessionId: input.agentSessionId,
      createdById: input.ctx.userId,
      title: input.title,
      description: input.description,
      riskLevel: input.riskLevel,
      actionType: input.actionType,
      targetSystem: input.targetSystem,
      payload: input.payload ?? {},
      status: "awaiting_approval",
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_create",  // or new action type
    resourceType: "action_proposal",
    resourceId: proposal.id,
    metadata: {
      title: proposal.title,
      riskLevel: proposal.riskLevel,
      status: proposal.status,
    },
  })

  return toProposalDto(proposal)
}

export async function getProposal(
  id: string,
  organizationId: string
): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id,
      project: { organizationId },
    },
  })
  if (!proposal) throw notFound("Proposal not found")
  return toProposalDto(proposal)
}

export async function listProposals(
  projectId: string,
  organizationId: string,
  options?: { status?: string }
): Promise<ActionProposalDto[]> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  })
  if (!project) throw notFound("Project not found")

  const proposals = await prisma.actionProposal.findMany({
    where: {
      projectId,
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  return proposals.map(toProposalDto)
}

export async function approveProposal(input: {
  ctx: AuthContext
  proposalId: string
  notes?: string
}): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: input.proposalId,
      project: { organizationId: input.ctx.organizationId },
    },
  })
  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "awaiting_approval") {
    throw forbidden("Proposal is not awaiting approval")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: input.proposalId },
    data: {
      status: "approved",
      approvedById: input.ctx.userId,
      approvalNotes: input.notes,
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_update",  // or new action type
    resourceType: "action_proposal",
    resourceId: input.proposalId,
    metadata: {
      action: "approved",
      approverEmail: input.ctx.user?.email,
    },
  })

  return toProposalDto(updated)
}

export async function rejectProposal(input: {
  ctx: AuthContext
  proposalId: string
  notes?: string
}): Promise<ActionProposalDto> {
  // Similar to approveProposal but with status: "rejected"
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: input.proposalId,
      project: { organizationId: input.ctx.organizationId },
    },
  })
  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "awaiting_approval") {
    throw forbidden("Proposal is not awaiting approval")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: input.proposalId },
    data: {
      status: "rejected",
      approvedById: input.ctx.userId,
      rejectionNotes: input.notes,
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "task_update",
    resourceType: "action_proposal",
    resourceId: input.proposalId,
    metadata: {
      action: "rejected",
      rejectorEmail: input.ctx.user?.email,
    },
  })

  return toProposalDto(updated)
}

function toProposalDto(proposal: any): ActionProposalDto {
  return {
    id: proposal.id,
    projectId: proposal.projectId,
    agentSessionId: proposal.agentSessionId,
    title: proposal.title,
    description: proposal.description,
    riskLevel: proposal.riskLevel,
    actionType: proposal.actionType,
    targetSystem: proposal.targetSystem,
    status: proposal.status,
    payload: proposal.payload,
    approvedById: proposal.approvedById,
    approvalNotes: proposal.approvalNotes,
    rejectionNotes: proposal.rejectionNotes,
    executedAt: proposal.executedAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  }
}
```

**Effort**: 2 hours (service + tests)

**Checklist**:
- [ ] Service layer implemented
- [ ] CRUD operations tested
- [ ] Error handling tested
- [ ] Audit logging verified

---

### Task 3: Create Approval API Endpoints

**Files**:
- `app/api/v1/projects/[projectId]/proposals/route.ts` (NEW)
- `app/api/v1/projects/[projectId]/proposals/[proposalId]/route.ts` (NEW)
- `app/api/v1/projects/[projectId]/proposals/[proposalId]/approve/route.ts` (NEW)
- `app/api/v1/projects/[projectId]/proposals/[proposalId]/reject/route.ts` (NEW)

**Implementation**:
```typescript
// GET /api/v1/projects/[projectId]/proposals
// List all proposals for a project

// GET /api/v1/projects/[projectId]/proposals/[proposalId]
// Get single proposal details

// POST /api/v1/projects/[projectId]/proposals/[proposalId]/approve
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; proposalId: string } }
) {
  const auth = await requireAuth()
  const org = await requireOrganization(auth)
  requirePermission(org.memberRole, "project:read")

  const body = await request.json()
  const { notes } = body as { notes?: string }

  const proposal = await approveProposal({
    ctx: auth,
    proposalId: params.proposalId,
    notes,
  })

  // TODO: Execute the approved action
  // This will be in Task 5

  return json({ data: proposal })
}

// POST /api/v1/projects/[projectId]/proposals/[proposalId]/reject
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; proposalId: string } }
) {
  const auth = await requireAuth()
  const org = await requireOrganization(auth)
  requirePermission(org.memberRole, "project:read")

  const body = await request.json()
  const { notes } = body as { notes?: string }

  const proposal = await rejectProposal({
    ctx: auth,
    proposalId: params.proposalId,
    notes,
  })

  return json({ data: proposal })
}
```

**Effort**: 3 hours (3 endpoints + tests)

**Checklist**:
- [ ] GET /proposals (list) endpoint works
- [ ] GET /proposals/[id] endpoint works
- [ ] POST /proposals/[id]/approve endpoint works
- [ ] POST /proposals/[id]/reject endpoint works
- [ ] Error handling tested
- [ ] Permissions enforced

---

### Task 4: Update proposeActionTool to Create ActionProposal

**File**: `lib/ai/tools/propose-action.ts`

**Change from**: Creating AuditLog entry  
**Change to**: Using createProposal service

```typescript
export const proposeActionTool = tool({
  description: "Propose a high-risk action for human review and approval",
  inputSchema: z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    targetSystem: z.string(),
    actionType: z.enum(["deploy", "publish", "delete", "rotate_secret", "grant_access"]),
    payload: z.record(z.unknown()).optional(),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    agentSessionId: z.string().optional(),
  }),
  execute: async (input, { context }) => {
    // Instead of creating AuditLog directly:
    const proposal = await createProposal({
      ctx: {
        userId: undefined,  // Agent doesn't have userId
        organizationId: context.organizationId,
      },
      projectId: input.projectId,
      agentSessionId: context.agentSessionId,
      title: input.title,
      description: input.description,
      riskLevel: input.riskLevel,
      actionType: input.actionType,
      targetSystem: input.targetSystem,
      payload: input.payload,
    })

    return {
      proposalId: proposal.id,
      status: "awaiting_approval",
      message: `Action "${input.title}" submitted for approval.`,
    }
  },
})
```

**Effort**: 1 hour

**Checklist**:
- [ ] proposeActionTool updated to use createProposal
- [ ] Tool tested with mock agent context
- [ ] ActionProposal created in DB when tool called

---

### Task 5: Implement Approval Action Execution

**File**: `lib/services/proposals.ts` (add new function)

**Implement**:
```typescript
export async function executeApprovedProposal(
  proposalId: string,
  organizationId: string
): Promise<void> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: proposalId,
      project: { organizationId },
    },
  })

  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "approved") {
    throw forbidden("Proposal is not approved")
  }

  try {
    // Based on actionType, execute the action
    switch (proposal.actionType) {
      case "deploy":
        await executeDeployment(proposal)
        break
      case "publish":
        await executePublish(proposal)
        break
      case "delete":
        await executeDelete(proposal)
        break
      // ... other action types
    }

    // Mark as executed
    await prisma.actionProposal.update({
      where: { id: proposalId },
      data: {
        status: "executed",
        executedAt: new Date(),
      },
    })

    // Log execution
    await writeAuditLog({
      ctx: { userId: proposal.approvedById, organizationId },
      organizationId,
      action: "task_update",
      resourceType: "action_proposal",
      resourceId: proposalId,
      metadata: { action: "executed" },
    })
  } catch (error) {
    // Log failure
    await writeAuditLog({
      ctx: { userId: proposal.approvedById, organizationId },
      organizationId,
      action: "task_update",
      resourceType: "action_proposal",
      resourceId: proposalId,
      metadata: {
        action: "execution_failed",
        error: error instanceof Error ? error.message : String(error),
      },
    })
    throw error
  }
}
```

**Effort**: 2-3 hours (depends on action types)

**Checklist**:
- [ ] executeApprovedProposal implemented
- [ ] Handles errors gracefully
- [ ] Audit logging on success/failure
- [ ] Tested with mock data

---

### Task 6: Create React Component for Approval UI

**File**: `components/proposals/approval-card.tsx` (NEW)

**Implement**:
```typescript
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function ApprovalCard({ proposal, onApprove, onReject, isLoading }) {
  const [notes, setNotes] = useState("")

  const riskColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  return (
    <Card className="border-2 border-yellow-300">
      <CardHeader>
        <CardTitle>{proposal.title}</CardTitle>
        <CardDescription>
          {proposal.actionType} → {proposal.targetSystem}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>{proposal.description}</p>

          <div className="flex items-center gap-2">
            <Badge className={riskColors[proposal.riskLevel]}>
              {proposal.riskLevel}
            </Badge>
          </div>

          <details>
            <summary>Payload</summary>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(proposal.payload, null, 2)}
            </pre>
          </details>

          <Textarea
            placeholder="Add approval notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => onReject(notes)}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={() => onApprove(notes)}
              disabled={isLoading}
            >
              Approve & Execute
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Effort**: 2 hours (component + page integration)

**Checklist**:
- [ ] ApprovalCard component created
- [ ] Rendered in proposal detail page
- [ ] Calls API endpoints on approve/reject
- [ ] Shows loading state
- [ ] Shows success/error feedback

---

### Task 7: End-to-End Testing

**File**: `__tests__/e2e/approval-workflow.test.ts` (NEW)

**Test scenarios**:
1. Agent proposes action → ActionProposal created in DB
2. Human fetches pending proposals → List returned
3. Human views proposal details → Full details shown
4. Human approves proposal → Status updated to "approved"
5. Action execution triggered → Task completes
6. Audit log shows full trace

**Effort**: 2 hours (comprehensive test coverage)

**Checklist**:
- [ ] Integration test for full workflow
- [ ] Unit tests for service layer
- [ ] API endpoint tests
- [ ] Error cases tested
- [ ] Audit trail verified

---

## Timeline

| Task | Effort | Days | Owner |
|:---|:---:|:---:|:---|
| 1. ActionProposal Schema | 1h | 0.5 | Backend |
| 2. Service Layer | 2h | 1 | Backend |
| 3. API Endpoints | 3h | 1.5 | Backend |
| 4. Update proposeActionTool | 1h | 0.5 | Backend |
| 5. Action Execution | 2-3h | 1.5 | Backend |
| 6. Approval UI | 2h | 1 | Frontend |
| 7. E2E Testing | 2h | 1 | QA |
| **Total** | **13-14h** | **~7 days** | **Team** |

---

## Success Criteria

### Functionality
- [x] Agent can propose high-risk action
- [x] Proposal stored in ActionProposal table
- [x] Human can view pending proposals
- [x] Human can approve/reject with notes
- [x] Approved action is executed
- [x] Full audit trail recorded

### Quality
- [x] 90%+ test coverage
- [x] No secret leaks during approval
- [x] Error handling for all failure modes
- [x] Performance: <500ms for approval endpoints
- [x] UI is responsive & user-friendly

### Security
- [x] Only authenticated users can approve
- [x] Only org members can see proposals
- [x] Credentials never exposed during proposal
- [x] Approval cannot be bypassed
- [x] Audit logs immutable

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|:---|:---:|:---|
| Credential leak during proposal | 🔴 High | Ensure payload is never logged as plaintext; test thoroughly |
| Race condition (approve + reject) | 🟡 Medium | Add optimistic locking or status guard |
| Cascade delete issues | 🟡 Medium | Test with dangling foreign keys |
| UI blocking during slow execution | 🟡 Medium | Async action execution (separate sprint) |

---

## Next Steps After Phase 0

1. **Async execution** — Long-running tasks run in background
2. **Notifications** — Slack/email when proposal needs approval
3. **Execution hooks** — Execute custom logic based on actionType
4. **Batch approvals** — Approve multiple proposals at once

---

## Questions for Team

1. Should approval require specific role (e.g., admin only)?
   - Recommendation: Any org member can approve (tracked in audit log)

2. Should rejected proposals have an "appeal" flow?
   - Recommendation: No, agent re-proposes if needed

3. Should we rate-limit proposals (e.g., max 10 per hour)?
   - Recommendation: No limit for Phase 0, add in Phase 2

4. Should approval expire if not reviewed in 24h?
   - Recommendation: No auto-expiration for Phase 0

---

**Document Version**: 1.0  
**Created**: 2024-06-15  
**Status**: Ready for implementation

