# Flowspace Architecture: Complete Design Documentation

## 📖 What This Folder Contains

This directory contains the complete architectural design for Flowspace, the Autonomous Operations Engine. It includes:

1. **ARCHITECTURE_01_DATA_MODEL.md** — Data model, entity relationships, encryption structure
2. **ARCHITECTURE_02_AGENT_CONTRACT.md** — How agents work, credential access pattern, tool registry
3. **ARCHITECTURE_03_PERMISSIONS.md** — Role-based access control, who can do what
4. **ARCHITECTURE_04_DECISIONS.md** — Locked decisions, open questions, implementation roadmap

---

## 🎯 One-Minute Summary

**Flowspace is a three-pillar autonomous operations platform:**

```
┌─────────────────────────────────────────────────────┐
│          FLOWSPACE CORE ENGINE                      │
├─────────────────────────────────────────────────────┤
│ 1. Secure Vault (Encryption & Zero-Leak Proxy)    │
│    • Org-scoped AES-256-GCM encryption             │
│    • Server-side credential injection (agentProxy) │
│    • Agents NEVER see raw API keys                 │
│                                                     │
│ 2. Autonomous Runtimes (Agents & Sandboxes)       │
│    • 4 agent types: Coding, Content, Ops, Research│
│    • Daytona Cloud Sandboxes for isolation        │
│    • Human-in-the-Loop approval for risky actions │
│                                                     │
│ 3. Augmentation Hub (External Tool Integrations)   │
│    • GitHub, Slack, Vercel, Google Workspace      │
│    • Agents use integrations via vault proxy       │
│    • Full audit trail of all actions               │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Core Architectural Principles

### 1. Organization is the Security Boundary
- All resources belong to exactly one organization
- Encryption keys are org-scoped
- Members have org-wide roles
- Audit logs are org-scoped

### 2. Vault Proxy = Zero-Leak Credential Access
```
Agent wants to call GitHub API
  ↓
Agent calls agentProxy({ service: "github", method: "POST", ... })
  ↓
Server-side:
  - Fetches GitHub integration token
  - Decrypts token with org encryption key
  - Injects token into request headers
  - Executes request
  - Returns response (never the token)
  ↓
Agent gets response data but NEVER sees raw token
```

### 3. Agent Sessions Track Autonomous Work
- Each agent session has state: idle → running → awaiting_approval → completed
- Linked to Daytona sandbox for code execution
- Agents create/update tasks, documents, proposals
- Full audit trail of every action

### 4. Human-in-the-Loop for High-Risk Actions
```
Agent wants to: Deploy to production
  ↓
Agent calls proposeAction({ title, description, payload, riskLevel })
  ↓
Server creates ActionProposal (awaiting_approval)
  ↓
UI renders approval card for human review
  ↓
Human approves/rejects
  ↓
If approved: action executes (agent doesn't execute directly)
```

---

## 📊 Data Model at a Glance

```
Organization (security boundary)
  ├── OrganizationEncryptionKey (AES-256-GCM)
  ├── Member[] (users with roles: owner, admin, member)
  ├── Project[]
  │   ├── Environment[] (dev, staging, prod)
  │   ├── Secret[] → SecretVersion[] (encrypted with org DEK)
  │   ├── Document[] (project context, prompts, runbooks)
  │   ├── Task[] (human-visible work items)
  │   ├── Integration[] (GitHub, Slack, Vercel per project)
  │   └── AgentSession[] (autonomous execution contexts)
  └── AuditLog[] (all actions, human or agent)
```

**Key insight**: Projects are the primary workspace unit. Everything else is scoped to a project (except encryption keys and audit logs, which are org-scoped).

---

## 🤖 Agent Architecture

### 4 Agent Personas

| Agent | Purpose | Primary Tools |
|:---|:---|:---|
| **Coding** | Build, test, deploy apps in Daytona | createSandbox, executeCommand, getSandboxPreview, agentProxy, createGitHubPR |
| **Content** | Draft blogs, newsletters, docs | createDocument, getDocuments, agentProxy |
| **Ops** | Manage tasks, deployments, Slack notifications | getTasks, createTask, searchAuditLogs, agentProxy |
| **Research** | Gather intelligence, synthesize reports | getDocuments, getTasks, searchAuditLogs |

### Tool Registry Pattern
```typescript
export const agentProxyTool = tool({
  description: "Make authenticated API call...",
  inputSchema: z.object({ ... }),
  contextSchema: z.object({ organizationId, ... }),
  execute: async (input, { context }) => {
    // Server-side execution
    // Agent cannot interfere with credential injection
  },
});
```

Every tool:
- Has a schema (Zod)
- Declares required context (organizationId, projectId, etc.)
- Is executed server-side (agent gets result, not internals)
- Is logged to audit trail

---

## 🔒 Zero-Leak Credential Pattern

### What Agents CAN'T Do
```typescript
// ❌ These tools don't exist:
const token = await getSecretValue(secretId);
const keys = await exportEnvironmentVariables();
const creds = await revealIntegrationToken();
```

### What Agents CAN Do
```typescript
// ✅ These tools exist and are safe:
const result = await agentProxy({
  projectId: "proj_123",
  service: "github",
  method: "POST",
  path: "/repos/owner/repo/pulls",
  body: { title, body, ... }
});
// Agent receives: { data: {...}, meta: {...} }
// Agent NEVER sees: GitHub token
```

**Why this works**: Server decrypts token, injects it, agent never touches it.

---

## 🛡️ Permission Model

### By Role
```
Operation                       | Owner | Admin | Member | Guest | Coding Agent
─────────────────────────────────────────────────────────────────────────────────
Create project                  |  ✅   |  ✅   |   ❌   |  ❌   |     ❌
View secret names               |  ✅   |  ✅   |   ✅   |  ✅   |     ✅
Reveal secret value             |  ✅   |  ✅   |   ✅   |  ❌   |     ❌
Use secret via agentProxy       |  ✅   |  ✅   |   ✅   |  ❌   |     ✅
Create document                 |  ✅   |  ✅   |   ✅   |  ❌   |     ✅
Create task                     |  ✅   |  ✅   |   ✅   |  ❌   |     ✅
Propose high-risk action        |  ✅   |  ✅   |   ✅   |  ❌   |     ✅
Approve agent action            |  ✅   |  ✅   |   ✅   |  ❌   |     N/A
```

**Key**: Agents have specific, limited permissions. They can't do everything a human can.

---

## 📋 Implementation Status

### ✅ Already Built
- [x] Organization & member management (Better Auth)
- [x] Project/environment/secret management
- [x] Encryption (AES-256-GCM with org DEK)
- [x] Audit logging
- [x] Agent proxy (zero-leak credential access)
- [x] Daytona SDK integration
- [x] Integration storage (GitHub, Slack, Vercel)
- [x] Agent sessions (state tracking)
- [x] Task management

### 🔴 Critical Gaps (MVP Blockers)
- [ ] ActionProposal entity (vs current AuditLog metadata)
- [ ] Approval workflow endpoints (GET, POST /approve, POST /reject)
- [ ] Agent async execution (background queue, not blocking request)
- [ ] HITL approval UI (modal card, notifications)

### 🟡 High-Priority (Phase 1)
- [ ] Tool context validation
- [ ] Agent type-based tool access
- [ ] Agent output rendering (terminal, code, markdown)
- [ ] Better error handling & recovery

### 🟢 Medium-Priority (Phase 2)
- [ ] Org-level agents (cross-project workflows)
- [ ] Integration token rotation
- [ ] Shared agent templates

---

## 🚀 Recommended Implementation Order

### This Week: Foundation
1. Create ActionProposal table (Prisma migration)
2. Implement approval endpoints:
   - GET /api/agents/proposals/[proposalId]
   - POST /api/agents/proposals/[proposalId]/approve
   - POST /api/agents/proposals/[proposalId]/reject
3. Add background job runner (Bull queue or simple DB polling)
4. Test proposal → approval → execution flow

**Goal**: HITL approval working end-to-end

### Next Week: Agent MVP
1. Implement tool context validation
2. Add agent type-based tool access checks
3. Build async agent execution
4. Improve agent output rendering
5. Add error recovery flows

**Goal**: Coding agent can build & deploy autonomously

### Week 3: Team Collaboration
1. Org-level agents (cross-project tasks)
2. Agent templates (reusable prompts)
3. Team notifications (Slack, email)
4. Better approval UI

**Goal**: Non-technical users can use agents

---

## 📊 Key Metrics to Track

- **Agent success rate**: % of tasks completed without human intervention
- **Approval time**: Minutes from proposal to approval
- **Secret leaks**: Should be 0 (vault proxy prevents it)
- **Audit trail completeness**: Every action logged
- **Performance**: Agent proxy latency (should be <500ms)

---

## 🎯 Open Questions for Team

1. **Should proposals be a first-class entity?** 
   - ✅ Recommended: YES (cleaner approval workflow)

2. **Should agents track step-by-step execution history?** 
   - 🤔 Start with: NO (use metadata JSON), upgrade later if needed

3. **Should agents be org-level or project-level?** 
   - 🤔 Start with: Project-level, add org-level agents in Phase 2

4. **How should agent errors be handled?** 
   - 🤔 Recommended: Escalate to human (propose action), not auto-retry

5. **Which agent should we build first?** 
   - 🤔 Recommended: Coding agent (highest value), then Ops, then Content, then Research

---

## 📚 Reading Order

1. **Start here** → This README (you are here)
2. **Next** → ARCHITECTURE_01_DATA_MODEL.md (understand the schema)
3. **Then** → ARCHITECTURE_02_AGENT_CONTRACT.md (understand how agents work)
4. **Then** → ARCHITECTURE_03_PERMISSIONS.md (understand access control)
5. **Finally** → ARCHITECTURE_04_DECISIONS.md (understand what's decided & what's open)

---

## 🔗 Related Files

- `prisma/schema.prisma` — Database schema (see models: Project, AgentSession, etc)
- `lib/ai/tools/` — Agent tool implementations (agentProxy, proposeAction, etc)
- `lib/services/` — Business logic (secrets, projects, tasks, etc)
- `app/api/v1/agent-proxy/route.ts` — Vault proxy endpoint
- `app/api/agents/sessions/route.ts` — Agent session CRUD
- `app/api/agents/sandboxes/route.ts` — Daytona sandbox management
- `app/api/agents/proposals/` — (TODO) Approval endpoints

---

## ✅ Verification Checklist

Before starting implementation:

- [ ] Team has read all 4 architecture documents
- [ ] Team has answered the 5 open questions
- [ ] Team agrees on Phase 1 scope (what to build first)
- [ ] Team agrees on permission model
- [ ] Team agrees on proposal entity design

---

## 💡 Example Workflows

### Workflow 1: Coding Agent Builds Landing Page
```
1. Human: "Build a Next.js landing page in the sandbox"
2. Server creates AgentSession (type: coding, status: idle)
3. Agent receives context (projectId, secrets available, integrations)
4. Agent calls createSandbox()
5. Agent executes: npm init, write code, npm build
6. Agent calls getSandboxPreview() → gets URL
7. Agent creates Document with link to preview
8. Agent updates task status: todo → done
9. Audit log records: agent created sandbox, executed commands, created doc
10. UI shows live preview + terminal output
```

### Workflow 2: Ops Agent Deploys with Approval
```
1. Human: "Deploy latest code to production"
2. Server creates AgentSession (type: ops)
3. Agent reads latest code changes from GitHub
4. Agent realizes: This is a production deployment (high-risk)
5. Agent calls proposeAction({
     title: "Deploy main to Vercel Production",
     description: "Promote latest build to prod",
     riskLevel: "high",
     payload: { ref: "main", environment: "production" }
   })
6. Server creates ActionProposal (status: awaiting_approval)
7. UI shows approval card with breakdown of changes
8. Human clicks "Approve" (after reviewing)
9. Server executes: agentProxy({service: "vercel", method: "POST", ...})
10. Vercel deployment triggered
11. Agent checks status, posts Slack update
12. Audit log: proposal created, approved, deployment executed
```

### Workflow 3: Content Agent Drafts Newsletter
```
1. Human: "Draft this week's product newsletter"
2. Server creates AgentSession (type: content)
3. Agent calls getDocuments() → finds product updates from past week
4. Agent calls getSecrets() → finds CMS API token (metadata only, not value)
5. Agent drafts content using best practices
6. Agent calls createDocument() → saves draft to project
7. Agent calls proposeAction({
     title: "Publish newsletter to Ghost CMS",
     description: "Post weekly digest",
     riskLevel: "low",
     payload: { documentId, cmsSection: "blog" }
   })
8. Human reviews draft in UI, clicks "Approve"
9. Agent uses agentProxy to POST newsletter to Ghost
10. Agent sends Slack notification: "Newsletter published"
11. Done!
```

---

## 🤝 Contributing to This Design

If you find gaps or have suggestions:

1. **File an issue** → Describe the gap or question
2. **Update the relevant architecture doc** → Include rationale
3. **Test the design** → Build a small prototype if uncertain
4. **Get team feedback** → Present in sync meeting

---

## 📞 Questions?

Refer to the architecture documents. If still unclear, open a discussion in the team channel.

---

**Last updated**: 2024-06-15  
**Status**: Design complete, implementation starting

