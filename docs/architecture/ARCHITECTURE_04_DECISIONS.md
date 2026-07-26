# Architectural Decisions & Implementation Gaps

## Overview

This document captures:
1. **Decisions already made** in the codebase (locked in)
2. **Decisions still open** (need to decide)
3. **Implementation gaps** (what's missing for full vision)
4. **Prioritization** (what to build first)

---

## 1. Decisions Already Locked In (Codebase)

### ✅ Authentication & Sessions

**Decision**: Use Better Auth (formerly AuthJS) for session management.

**Implementation**:
- `better-auth` handles user signup, sign-in, 2FA, OAuth integrations
- Sessions stored in DB with `activeOrganizationId`
- Each request context includes: `userId`, `organizationId`, `memberRole`

**Rationale**: Proven, secure, supports enterprise SSO/SAML (future)

**Trade-offs**: Tied to Better Auth ecosystem (migration cost high)

---

### ✅ Organization as Security Boundary

**Decision**: Organization is the fundamental security unit.

**What this means**:
- All resources (projects, secrets, documents) belong to exactly one org
- Encryption keys are org-scoped (one DEK per org)
- Members have org-wide roles (owner, admin, member)
- Audit logs are org-scoped

**Implementation**:
```typescript
// Every table with org scope:
organizationId String @unique || @index
organization Organization @relation(fields: [organizationId])
```

**Rationale**: Simplifies multi-tenancy, key rotation, audit trails

**Trade-offs**: Projects cannot be shared across orgs; users must switch org context

---

### ✅ Projects as Workspace Containers

**Decision**: Project is the primary unit of work (like a GitHub repo).

**What a project contains**:
- Multiple environments (dev, staging, prod)
- Multiple secrets (scoped per environment)
- Multiple documents
- Multiple tasks
- Multiple integrations (GitHub, Slack, Vercel per project)
- Agent sessions (agents execute within project scope)

**Implementation**:
```typescript
model Project {
  organizationId String
  environments Environment[]
  secrets Secret[]
  documents Document[]
  tasks Task[]
  integrations Integration[]
  agentSessions AgentSession[]
}
```

**Rationale**: Mirrors GitHub/Vercel mental model; clean permission boundaries

**Trade-offs**: Cross-project tasks/documents would need special handling

---

### ✅ Envelope Encryption with Per-Version IVs

**Decision**: Secrets use AES-256-GCM envelope encryption with unique IVs per version.

**How it works**:
```
1. Organization has OrganizationEncryptionKey:
   - wrappedDek: AES-256-GCM encrypted DEK (wrapped with master key)
   - keyVersion: tracks DEK rotation

2. Each Secret has SecretVersion[]:
   - ciphertext: AES-256-GCM(plaintext, DEK, IV)
   - iv: random 12-byte IV (unique per version)
   - authTag: GCM authentication tag
   - keyVersion: which DEK version was used

3. Decrypt workflow:
   - Fetch OrganizationEncryptionKey
   - Unwrap DEK (using app KMS or HSM)
   - For each SecretVersion: AES-256-GCM decrypt(ciphertext, DEK, IV, authTag)
```

**Rationale**: 
- Industry standard (matches OWASP, NIST guidance)
- Enables key rotation without re-encrypting all secrets
- Per-version IVs prevent pattern attacks

**Trade-offs**: Cannot search encrypted secrets without decrypting (by design)

**Current gap**: HSM/KMS integration not implemented (wrappedDek wrapped with app-level key)

---

### ✅ Integrations Encrypted Per-Project

**Decision**: Integration tokens (GitHub, Slack, Vercel) are encrypted with org DEK, stored in Integration table.

**Implementation**:
```typescript
model Integration {
  projectId String
  provider "github" | "slack" | "vercel"
  accessTokenEncrypted String    // Encrypted with org DEK
  refreshTokenEncrypted String?  // Encrypted with org DEK
  metadata Json?                 // Can store non-sensitive config
}
```

**Rationale**: 
- If org loses DEK access, integrations become unreadable (security by design)
- Allows per-project GitHub/Slack tokens

**Current gap**: No token rotation mechanism; manual re-connect required

---

### ✅ Agent Proxy for Zero-Leak Credentials

**Decision**: Agents never see raw API keys. Instead, use server-side vault proxy.

**Flow**:
```
Agent: "POST to /repos/owner/repo/pulls"
  ↓
Agent calls agentProxyTool({ service: "github", method: "POST", ... })
  ↓
Server-side /api/v1/agent-proxy:
  1. Verify org scope & project scope
  2. Fetch Integration record
  3. Decrypt token with org DEK
  4. Add to Authorization header
  5. Execute proxied request
  6. Return response (never token)
```

**Rationale**: 
- Credentials never exposed to agent LLM context
- Agent cannot accidentally log, export, or misuse tokens
- Full audit trail of proxy calls

**Trade-offs**: Every external API call goes through proxy (adds latency, centralized logging)

---

### ✅ Audit Logging for All Actions

**Decision**: Every significant action (human or agent) is logged to AuditLog table.

**What gets logged**:
- Organization changes (create, update, delete)
- Project/environment changes
- Secret access (reveal, export, delete)
- Integration changes
- Task changes
- Agent actions (proxy calls, proposals, approvals)

**Implementation**:
```typescript
model AuditLog {
  organizationId String
  action AuditAction  // 20+ enum values
  resourceType String
  resourceId String
  metadata Json       // Action-specific context
  actorType "user" | "agent"
  actorUserId String  // null if agent
  ipAddress String
  userAgent String
  createdAt DateTime
}
```

**Rationale**: HIPAA/SOC2 compliance; debugging; incident investigation

**Current gap**: No SIEM integration; audit logs only in DB (no external forwarding)

---

### ✅ Agent Sessions Track Autonomous Work

**Decision**: AgentSession is a separate entity from Task. It tracks agent state, not human tasks.

**AgentSession purpose**:
- Links agent execution to Daytona sandbox
- Tracks agent status (idle, running, awaiting_approval, completed, failed)
- Stores agent metadata (type, prompt, currentTask, output)
- Provides UI with real-time agent feedback

**AgentSession ≠ Task**:
- Task: human-facing work item (can be assigned to users)
- AgentSession: agent-internal state machine

**Implementation**:
```typescript
model AgentSession {
  projectId String
  name String           // e.g., "Build landing page"
  type "coding" | "content" | "ops" | "research"
  status "idle" | "running" | "awaiting_approval" | ...
  daytonaSandboxId String?
  sandboxUrl String?
  currentTask String?   // What agent is doing now
  metadata Json?        // Output, state, etc
}
```

**Rationale**: 
- Cleanly separates agent state from human work
- Allows multiple agents per project without conflict
- Enables async agent execution

**Current gap**: No explicit step-by-step action history (metadata is blob)

---

### ✅ Daytona SDK for Sandbox Management

**Decision**: Use Daytona Cloud Sandboxes for agent coding work.

**What works**:
- Create sandbox (JavaScript, Python, TypeScript)
- Execute commands inside sandbox
- Get live preview URL (for web previews)
- Stop/start/delete sandbox
- List all sandboxes

**Implementation**:
```typescript
// lib/daytona.ts
export function getDaytonaClient() { ... }
export async function createSandbox(name, language) { ... }
export async function getSandboxPreviewUrl(id, port) { ... }
```

**Rationale**: 
- Isolated environments for agent code execution
- Live web previews for UI development
- No local compute required

**Trade-offs**: Daytona costs money; limited to 4 languages; requires API key

**Current gap**: No persistent workspace state; each sandbox is ephemeral

---

## 2. Decisions Still Open (Need Input)

### ⚠️ Should AgentSession Track Step-by-Step History?

**Question**: Should we store detailed logs of every tool call, error, and decision the agent made?

**Option A**: Store in metadata JSON (current approach)
- Pros: Simple, flexible, no new table
- Cons: Hard to query, blob of unstructured data

**Option B**: Create AgentExecutionStep table
```typescript
model AgentExecutionStep {
  agentSessionId String
  stepNumber Int
  action String           // "tool_call" | "error" | "decision"
  toolName String         // "agentProxy" | "createTask"
  input Json
  output Json
  status "pending" | "success" | "failed"
  duration Int            // ms
  createdAt DateTime
}
```
- Pros: Queryable, detailed debugging, easy analytics
- Cons: More storage, complexity

**Recommendation**: Start with Option A (current), upgrade to B if we need debugging/replay features.

---

### ⚠️ Should Tasks Be Assignable to Agents?

**Question**: Can an agent be assigned to a task? (like assigning to a human)

**Current model**: Tasks have `assigneeId` (User FK only)

**Option A**: Keep assigneeId as User only
- Pros: Simple, clear human accountability
- Cons: Agent-created tasks have no owner

**Option B**: Extend assigneeId to support both User and Agent
```typescript
// Polymorphic approach
model Task {
  assigneeId String?
  assigneeType "user" | "agent"  // Discriminator
  // Or create separate: assigneeUserId, assigneeAgentId
}
```
- Pros: Agents can self-assign work
- Cons: More complex, edge cases (what if agent is deleted?)

**Recommendation**: Start with Option A (human-only). Upgrade to B if you want agents to autonomously manage task boards.

---

### ⚠️ Should Proposals Be a First-Class Entity?

**Question**: Should action proposals have their own table?

**Current model**: Proposals are recorded in AuditLog with:
```typescript
{
  action: "task_create",
  resourceType: "action_proposal",
  metadata: {
    proposalId, status: "awaiting_approval", payload, ...
  }
}
```

**Option A**: Keep in AuditLog (current)
- Pros: All history in one place, audit trail is complete
- Cons: Hard to query active proposals; approval workflow needs custom logic

**Option B**: Create Proposal table
```typescript
model ActionProposal {
  id String
  projectId String
  agentSessionId String
  title String
  description String
  riskLevel "low" | "medium" | "high" | "critical"
  actionType String
  payload Json
  status "awaiting_approval" | "approved" | "rejected" | "executed"
  approvedById String?
  approvalNotes String?
  createdAt DateTime
  executedAt DateTime?
}
```
- Pros: Clear approval workflow, easy to query pending proposals
- Cons: Duplication with AuditLog, migration complexity

**Recommendation**: Start with Option B. It's a core feature (HITL approval) and deserves a proper entity.

---

### ⚠️ Should Agents Be Org-Level or Project-Level?

**Question**: Can an agent span multiple projects in one org?

**Example use case**: Ops agent monitors deployments across 3 projects and sends daily Slack summary

**Current model**: AgentSession belongs to one project only

**Option A**: Keep project-scoped (current)
- Pros: Clear resource boundaries, simple permission model
- Cons: Can't build org-wide monitoring/reporting agents

**Option B**: Support org-level agents
```typescript
// In AgentSession:
projectId String?     // null = org-level agent
// Or create separate AgentSessionOrg table
```
- Pros: Enables cross-project workflows
- Cons: Permission model becomes complex

**Recommendation**: Start with Option A (project-scoped). Build org-level agents as Phase 2 feature.

---

### ⚠️ How Should Agent Error Recovery Work?

**Question**: If an agent fails mid-execution, what should happen?

**Current behavior**: Agent status = "failed", human must investigate

**Options**:
1. **Manual retry**: Human manually re-triggers agent
2. **Automatic retry**: Agent retries with exponential backoff
3. **Fallback**: Agent proposes alternative action
4. **Escalation**: Create task for human review

**Recommendation**: Implement all 4. Start with manual + escalation (simple). Add automatic retry later.

---

## 3. Implementation Gaps

### 🔴 Critical Gaps (Block MVP)

#### 1. Approval Workflow Backend
**Current state**: Proposal tool exists; approval endpoints don't

**What's needed**:
- [x] proposeActionTool (✅ exists)
- [ ] GET /api/agents/proposals/[proposalId] (read proposal details)
- [ ] POST /api/agents/proposals/[proposalId]/approve (approve & execute)
- [ ] POST /api/agents/proposals/[proposalId]/reject (reject with notes)
- [ ] Background job to execute approved actions

**Effort**: Medium (1-2 days)

**Blocker for**: HITL security feature

---

#### 2. Agent Async Execution
**Current state**: Agents are synchronous (request → response)

**What's needed**:
- [ ] Queue system (Bull, RabbitMQ, or simple DB polling)
- [ ] Agent worker process (runs in background)
- [ ] WebSocket updates to UI (real-time status)
- [ ] Timeout handling & graceful shutdown
- [ ] Error recovery & retry logic

**Effort**: High (3-5 days)

**Blocker for**: Long-running tasks (builds, deployments)

---

#### 3. Explicit Proposal Entity
**Current state**: Proposals in AuditLog metadata

**What's needed**:
- [ ] ActionProposal table (as discussed above)
- [ ] Proposal CRUD endpoints
- [ ] Proposal status tracking (awaiting → approved → executed)
- [ ] Approval notification UI (modal, notification)

**Effort**: Medium (2-3 days)

**Blocker for**: Clean approval workflow

---

### 🟡 High-Priority Gaps (Phase 1)

#### 4. Tool Context Validation
**Current state**: Tools accept context; no validation it's correct

**What's needed**:
- [ ] Schema validation for each tool's context (organizationId must exist, projectId must exist in org, etc.)
- [ ] Runtime guard: throw if context is invalid
- [ ] Test coverage for permission checks

**Effort**: Low (1 day)

**Impact**: Prevents subtle permission bugs

---

#### 5. Agent Type-Based Tool Access
**Current state**: All agents can call all tools

**What's needed**:
- [ ] Tool registry with `allowedAgentTypes`
- [ ] Runtime check: throw if agent type not in allowedAgentTypes
- [ ] Finalize tool matrix (which tools for which agents)

**Effort**: Low-Medium (1-2 days)

**Impact**: Prevents agents from doing unauthorized work

---

#### 6. Secret Version History UI
**Current state**: Backend tracks versions; UI doesn't show them

**What's needed**:
- [ ] `/app/dashboard/projects/[projectId]/environments/[envId]/secrets/[secretId]/versions`
- [ ] Version comparison (show what changed)
- [ ] Rollback UI (revert to old version)

**Effort**: Low (1 day)

**Impact**: Auditability, compliance

---

#### 7. Action Proposal Notifications
**Current state**: No notifications when proposal created

**What's needed**:
- [ ] In-app notification (bell icon)
- [ ] Email notification (optional)
- [ ] Slack notification (via integration)
- [ ] Notification preferences (user settings)

**Effort**: Medium (2-3 days)

**Impact**: User experience, faster approval cycles

---

### 🟢 Medium-Priority Gaps (Phase 2)

#### 8. Agent Output Rendering
**Current state**: Raw agent responses in ComputerPanel

**What's needed**:
- [ ] Format terminal output nicely
- [ ] Syntax highlight code blocks
- [ ] Render markdown from agent output
- [ ] Embed artifacts (files, images, links)
- [ ] Expandable/collapsible sections

**Effort**: Medium (2-3 days)

**Impact**: Better UX, easier to read agent work

---

#### 9. Integration Token Rotation
**Current state**: Manual re-connect required

**What's needed**:
- [ ] OAuth refresh token flow (auto-refresh access tokens)
- [ ] Scheduled rotation (monthly rotate all tokens)
- [ ] Rotation notifications

**Effort**: High (3-4 days)

**Impact**: Security, reduced manual work

---

#### 10. Cross-Project Agent Workflows
**Current state**: Agents are project-scoped

**What's needed**:
- [ ] Org-level agent type
- [ ] Multi-project resource querying
- [ ] Cross-project permission model

**Effort**: High (4-5 days)

**Impact**: Advanced ops workflows

---

#### 11. HSM/KMS Integration
**Current state**: Encryption keys wrapped at app level

**What's needed**:
- [ ] AWS KMS integration (or equiv)
- [ ] Key envelope encryption with HSM
- [ ] Compliance audit trail for key access

**Effort**: Very High (5+ days)

**Impact**: Enterprise security compliance

---

### 🟢 Low-Priority Gaps (Future)

#### 12. SIEM Integration
- Audit log forwarding to Splunk/Datadog/CloudWatch
- Real-time alerting

#### 13. IP Whitelisting
- Restrict integration access by IP

#### 14. Rate Limiting
- Per-integration rate limits
- Per-agent rate limits

#### 15. Agent Marketplace
- Share agent templates across orgs
- Reusable agent prompts

---

## 4. Prioritized Roadmap

### Phase 0: Foundation (This sprint)
- [x] Data model (Organization → Project → Task → Agent)
- [x] Agent execution contract (vault proxy, tool registry)
- [x] Permission matrix
- [ ] Proposal entity (ActionProposal table)
- [ ] Approval workflow backend

**Timeline**: 1-2 weeks

**Goal**: HITL approval flow working end-to-end

---

### Phase 1: MVP Agent Features (Week 3-4)
- [ ] Tool context validation
- [ ] Agent type-based tool access
- [ ] Agent async execution (background queue)
- [ ] Sandbox persistence / state management
- [ ] Better agent output rendering

**Timeline**: 2-3 weeks

**Goal**: Coding agent can build & deploy autonomously

---

### Phase 2: Team Collaboration (Week 5-6)
- [ ] Cross-project workflows (org-level agents)
- [ ] Shared agent templates
- [ ] Team notifications & approvals
- [ ] Better proposal UI (modal cards, Slack notifications)

**Timeline**: 2-3 weeks

**Goal**: Non-technical team members can use agents

---

### Phase 3: Security & Compliance (Week 7-8)
- [ ] HSM/KMS integration
- [ ] SIEM integration
- [ ] IP whitelisting
- [ ] Token rotation automation

**Timeline**: 2-3 weeks

**Goal**: Enterprise-ready security

---

## 5. Key Metrics & Success Criteria

### For This Document

- [ ] Team agrees on data model
- [ ] Team agrees on agent execution contract
- [ ] Team agrees on permission matrix
- [ ] All open questions are answered
- [ ] Roadmap is ranked by business priority

### For Phase 0 (Approval Workflow)

- [ ] Agent can propose action
- [ ] Human can approve/reject from UI
- [ ] Approved action is executed
- [ ] Full audit trail recorded
- [ ] No secret leaks in proposal or execution

### For Phase 1 (Agent MVP)

- [ ] Coding agent can build Next.js app in Daytona
- [ ] Live preview updates in real-time
- [ ] Agent can push to GitHub
- [ ] Agent can trigger Vercel deploy
- [ ] Agent can post Slack summary
- [ ] All errors are gracefully handled & logged

---

## 6. Questions for Team Discussion

1. **Should proposals be first-class entity?** (Decision: Yes → Option B)
2. **Should agents track step-by-step history?** (Decision: Start with Option A)
3. **Should tasks be assignable to agents?** (Decision: Start with human-only)
4. **Should agents be org-level or project-level?** (Decision: Start with project-level)
5. **What's the priority: coding agent → content agent → ops agent?** (Recommendation: Coding first)
6. **Do we need HSM/KMS for MVP?** (Recommendation: No, add in Phase 3)
7. **How should long-running agent tasks be handled?** (Recommendation: Background queue + WebSocket updates)

---

## 7. Implementation Next Steps

1. **Finalize ActionProposal schema** (get buy-in from team)
2. **Implement approval endpoints** (the backend logic)
3. **Test proposal → approval → execution flow** (end-to-end)
4. **Build UI for approvals** (modal card, notification)
5. **Integrate with Slack** (send approval notifications)
6. **Load test** (can agents handle concurrent work?)

**Then**: Repeat for each phase.

