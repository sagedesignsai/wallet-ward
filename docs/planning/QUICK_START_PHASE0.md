# Quick Start: Phase 0 Approval Workflow

**What**: End-to-end approval workflow for agent actions  
**Status**: 71% complete (5 of 7 tasks done)  
**Timeline**: 6-7 hours done, 6-7 hours remaining  
**Build**: Ready for validation  

---

## 🚀 Quick Overview

### The Flow
```
1. Agent proposes action (proposeActionTool)
   ↓
2. Human approves (POST /approve)
   ↓
3. System executes (executeProposal)
   ↓
4. Agent checks status (getPendingProposals)
   ↓
5. Continues workflow
```

### What's Done
- ✅ Execution engine (executeProposal)
- ✅ Approval endpoint
- ✅ Agent polling
- ✅ Tool access control

### What's Left
- 🔄 UI component (approval card)
- 🔄 Integration tests

---

## 📁 Key Files Changed

### Core Execution
**File**: `lib/services/proposals.ts`
**Change**: +524 LOC, added execution functions
```typescript
// NEW - Execute proposal's action
executeProposal(input: { ctx, proposalId })

// NEW - Get proposal safely
getProposalOrThrow(id, orgId)

// HANDLERS:
executeDeployAction()      // → Vercel
executePublishAction()     // → Slack/Ghost  
executeDeleteAction()      // → GitHub/doc/secret
executeRotateSecretAction()// → Phase 0 stub
```

### Approval Endpoint
**File**: `app/api/v1/projects/[projectId]/proposals/[proposalId]/approve/route.ts`
**Change**: Added execution on approval
```typescript
// Approve → Execute → Mark executed
1. approveProposal()
2. executeProposal()  // NEW
3. markProposalExecuted()
```

### Agent Polling
**File**: `app/api/agents/sessions/[sessionId]/pending-proposals/route.ts` (NEW)
**Endpoint**: `GET /api/agents/sessions/[sessionId]/pending-proposals`
```typescript
Returns: {
  session: { id, name, type, status },
  pendingProposals: {
    awaiting: [...],   // Waiting for human
    approved: [...],   // Ready to execute
    rejected: [...],   // Human said no
    executed: [...],   // Done
    failed: [...]      // Error
  }
}
```

### Tool Access Control
**File**: `lib/ai/tool-access.ts` (NEW)
**Purpose**: Define which agent types can use which tools
```typescript
TOOL_ACCESS_MATRIX = {
  createSandbox: ["coding"],
  triggerVercelDeploy: ["coding", "ops"],
  getSecrets: ["coding", "ops"],  // NOT content/research!
  getDocuments: ["content", "ops", "research"],
  // ... etc
}
```

---

## 🔧 How It Works

### 1. Agent Proposes Action
```typescript
// Agent calls existing tool
proposeActionTool({
  projectId: "proj_123",
  title: "Deploy main to production",
  description: "Promote latest code",
  riskLevel: "high",
  actionType: "deploy",
  targetSystem: "Vercel Production",
  payload: { environment: "production", ref: "main" }
})

// Returns: { proposalId, status: "awaiting_approval" }
```

### 2. Human Approves
```typescript
// POST /api/v1/projects/proj_123/proposals/prop_xyz/approve
POST /approve
body: { notes: "Looks good" }

// Returns:
{
  data: { ...proposal, status: "executed", executedAt: "2026-07-26..." },
  execution: {
    success: true,
    message: "Deployment triggered: https://project-prod.vercel.app",
    result: {
      deploymentId: "dpl_123",
      url: "https://project-prod.vercel.app",
      environment: "production"
    }
  }
}
```

### 3. Execution Happens Server-Side
```typescript
// In executeProposal():
1. Get Vercel integration
2. Decrypt token (vault proxy)
3. Call Vercel API
4. Save result to proposal.metadata
5. Log to audit trail
```

### 4. Agent Checks Status
```typescript
// Agent calls new tool
getPendingProposalsTool({
  sessionId: "agent_session_123"
})

// Returns:
{
  summary: { awaitingCount: 2, approvedCount: 1, rejectedCount: 0 },
  pendingProposals: {
    approved: [
      {
        id: "prop_xyz",
        title: "Deploy main to production",
        status: "approved",
        executionResult: { success: true, url: "..." }
      }
    ]
  }
}

// Agent sees it was approved and continues!
```

---

## 🧪 Testing Now (Before Build)

### Type Check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build
```

### If Errors
1. Check error message
2. Most likely: import path or type issue
3. Review the specific file
4. Fix and retry

---

## 🏗️ What's Still Needed

### Task 6: UI Component (3 hours)
Create proposal approval card for dashboard/workspace:

**File to create**: `components/proposals/approval-card.tsx`
```typescript
export function ApprovalCard({ proposal }: { proposal: ActionProposalDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{proposal.title}</CardTitle>
        <RiskBadge level={proposal.riskLevel} />
      </CardHeader>
      <CardContent>{proposal.description}</CardContent>
      <CardFooter>
        <Button onClick={handleApprove}>Approve</Button>
        <Button onClick={handleReject}>Reject</Button>
      </CardFooter>
    </Card>
  )
}
```

**Where to place**:
- Workspace side panel (show current project proposals)
- Dashboard alerts (show critical proposals)
- `/dashboard/proposals` page (list all)

### Task 7: Tests (4 hours)
Create integration tests in `__tests__/approval-workflow.integration.test.ts`:

```typescript
describe("Approval Workflow", () => {
  test("agent proposes → human approves → action executes", async () => {
    // 1. Create proposal
    // 2. POST to /approve
    // 3. Verify execution result
    // 4. Check audit log
  })

  test("handles missing integration gracefully", async () => {
    // Proposal without Vercel integration
    // /approve should return error with helpful message
  })

  test("agent polls for approval status", async () => {
    // GET /api/agents/sessions/.../pending-proposals
    // Should return proposal by status
  })
})
```

---

## 🔒 Security Review

### ✅ No Credential Leaks
- Tokens decrypted server-side only
- Never sent to client
- Never stored in plaintext
- Verified in `executeDeployAction`, `executePublishToSlack`, etc.

### ✅ Org-Scoped Access
- All queries check `organizationId`
- All endpoints verify org membership
- Example: `project.organizationId === auth.organizationId`

### ✅ Immutable Audit Trail
- Every state change logged: created, approved, executed
- Stored in `AuditLog` table
- Cannot be modified after fact

### ✅ Tool Access Enforced
- `getSecrets` requires `agentType: ["coding", "ops"]`
- Content/research agents get clear error
- Matrix prevents unauthorized tool use

---

## 📊 What the Code Does

### When Approval Endpoint Called
```
POST /api/v1/projects/proj_123/proposals/prop_xyz/approve
  ↓
1. Verify user authenticated + org member
2. Verify user has project:write permission
3. Get proposal from DB (org-scoped query)
4. Verify proposal status is "awaiting_approval"
5. Update to "approved" (approvedBy: userId)
6. Log to audit trail: "proposal approved"
  ↓
7. Call executeProposal()
   a. Get proposal (with includes)
   b. Verify status is "approved"
   c. Get project + integrations
   d. Route by actionType
      - deploy: find Vercel, decrypt token, call API
      - publish: find Slack/Ghost, decrypt, send message
      - delete: find target, delete
      - rotate: mark for rotation
   e. Save result to proposal.metadata
   f. Log execution attempt (success/failure)
  ↓
8. If success: Mark proposal as "executed"
9. If error: Mark proposal as "failed"
10. Return { data: proposal, execution: result }
```

### When Agent Polls for Proposals
```
GET /api/agents/sessions/agent_123/pending-proposals
  ↓
1. Verify user authenticated
2. Get session (org-scoped)
3. Query all proposals for this session
4. Group by status (awaiting, approved, rejected, executed, failed)
5. Return grouped proposals
  ↓
Agent sees:
- 0 awaiting: human hasn't decided
- 1 approved: ready to continue!
- 0 rejected: no rejections
- 1 executed: previous action completed
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run build && npm run lint` (no errors)
- [ ] Review changes in git
- [ ] No secrets in code
- [ ] All imports resolve

### Testing
- [ ] Manual test: propose action
- [ ] Manual test: approve action
- [ ] Manual test: check execution result
- [ ] Manual test: poll for status
- [ ] Manual test: error handling

### Post-Deployment  
- [ ] Monitor logs for errors
- [ ] Check audit trail
- [ ] Verify integrations work
- [ ] Test with real Vercel/Slack/GitHub

---

## 📝 Command Reference

### Build & Validate
```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run build        # Full build
```

### Testing (When Complete)
```bash
npm run test -- approval-workflow.integration.test.ts
npm run test:watch   # Watch mode
```

### Development
```bash
npm run dev          # Start dev server
# Open http://localhost:3000
# Create proposal
# Approve
# Check results
```

### Database
```bash
npx prisma studio   # View database
npx prisma migrate  # Run migrations (if needed)
```

---

## 🎯 Success Criteria

When Phase 0 is fully complete, verify:

```
[ ] Build passes: npm run build (no errors)
[ ] Types pass: npm run type-check (no errors)
[ ] Lint passes: npm run lint (no errors)

[ ] Agent can propose action (existing tool works)
[ ] Human can approve action (endpoint works)
[ ] Action executes automatically (executeProposal works)
[ ] Result saved to audit log (immutable trail)
[ ] Agent can check status (polling works)

[ ] No credentials leaked (vault proxy enforced)
[ ] Org-scoping works (queries validated)
[ ] Tool access restricted (matrix enforced)
[ ] Errors handled gracefully (no crashes)

[ ] UI displays proposals (Task 6 complete)
[ ] Tests passing (Task 7 complete)
```

---

## 🆘 Troubleshooting

### Build Error: "Cannot find module..."
→ Check import paths, especially new files

### TypeScript Error: "Property does not exist..."
→ Check if type definitions updated in Prisma client

### Runtime Error: "Project not found"
→ Verify org-scoping: is projectId in correct org?

### Execution fails: "No integration found"
→ Expected! Test with project that has Vercel/Slack connected

### Agent can't use tool
→ Check tool-access.ts matrix for agent type restrictions

---

## 📚 More Information

- **Full roadmap**: `IMPLEMENTATION_PHASE0.md`
- **Technical spec**: `TASK1_SPEC.md`
- **Progress update**: `PHASE0_PROGRESS.md`
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🚢 Next Steps

1. **Validate build**: `npm run build && npm run lint`
2. **Fix any errors** (if needed)
3. **Implement UI** (Task 6, 3 hours)
4. **Write tests** (Task 7, 4 hours)
5. **Deploy to staging**
6. **Test with real integrations**
7. **Deploy to production**

---

**Ready?** Run `npm run build` and let's go! 🚀
