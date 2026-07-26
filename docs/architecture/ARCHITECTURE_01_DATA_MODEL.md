# Flowspace Data Model & Entity Relationships

## 🎯 Overview

The data model centers on the **Organization** as the security boundary. All resources (Projects, Secrets, Tasks, Agents, Integrations) are scoped to an organization and governed by member permissions.

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORGANIZATION                                 │
│  (Security boundary, billing unit, encryption key scope)         │
├─────────────────────────────────────────────────────────────────┤
│ • id (cuid)                                                       │
│ • name, slug, logo, metadata                                     │
│ • OrganizationEncryptionKey (1:1) — AES-256-GCM DEK wrapper     │
│ • createdAt, updatedAt                                           │
└────────┬──────────────────────────┬──────────────┬──────────────┘
         │                          │              │
         │ has many                 │ has many     │ has many
         ▼                          ▼              ▼
   ┌─────────────┐          ┌──────────────┐  ┌──────────────┐
   │  MEMBER     │          │  INVITATION  │  │  AUDITLOG    │
   ├─────────────┤          ├──────────────┤  ├──────────────┤
   │ • userId    │          │ • email      │  │ • action     │
   │ • role      │          │ • role       │  │ • resourceId │
   │ • createdAt │          │ • status     │  │ • metadata   │
   └─────────────┘          │ • expiresAt  │  │ • createdAt  │
                            └──────────────┘  └──────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                        PROJECT                                    │
│  (Workspace container: environments, tasks, documents, agents)    │
├──────────────────────────────────────────────────────────────────┤
│ • id (cuid)                                                        │
│ • organizationId (FK) — Org scope                                 │
│ • name, slug, description                                         │
│ • createdAt, updatedAt                                            │
│ • Unique: (organizationId, slug)                                  │
└────┬─────────────┬──────────────┬──────────┬───────────┬─────────┘
     │             │              │          │           │
     │ has many    │ has many     │ has 1+  │ has many  │ has many
     ▼             ▼              ▼         ▼           ▼
┌──────────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────────────┐
│ ENVIRONMENT  │ │ DOCUMENT │ │  TASK  │ │INTEGRATION│ │ AGENTSESSION │
├──────────────┤ ├──────────┤ ├────────┤ ├─────────┤ ├──────────────┤
│ • projectId  │ │ projectId│ │project │ │projectId│ │ • projectId  │
│ • name       │ │ • title  │ │Id      │ │ • provider│ │ • name       │
│ • slug       │ │ • content│ │ • title│ │ • name  │ │ • type       │
│ • description│ │ • createdById│ • description│ │ • accessTokenEnc│ │ (coding|content|ops|research)
│ • secrets    │ │ • createdAt │ • status     │ │ • enabled   │ │ • status     │
│              │ │ • updatedAt │ (todo|in_progress|done)│ │ • daytonaSandboxId│
│              │ │            │ • assigneeId  │ │ • createdAt │ │ • sandboxUrl │
│              │ │            │              │ │ • updatedAt │ │ • currentTask│
│              │ │            │              │ └─────────┘ │ • metadata   │
│              │ │            │              │             └──────────────┘
└──────────────┘ └──────────┘ └────────┘     │
     │                                        │
     │ has many                               │ has many
     ▼                                        ▼
  ┌────────────┐                         ┌─────────────┐
  │  SECRET    │                         │ INTEGRATION │
  ├────────────┤                         │   CONFIG    │
  │ • projectId│                         │ (GitHub, Slack, Vercel)
  │ • envId    │                         └─────────────┘
  │ • name     │
  │ • type     │
  │ • currentVersion
  │ • versions[]→SecretVersion
  └────────────┘
```

---

## 🔐 Encryption & Credential Scoping

### Vault Structure (per Organization)
```
Organization
  ├── OrganizationEncryptionKey (1:1)
  │   ├── wrappedDek (AES-256-GCM wrapped Data Encryption Key)
  │   ├── wrapIv, wrapAuthTag
  │   ├── keyVersion (for key rotation)
  │   └── algorithm ("aes-256-gcm")
  │
  └── Project (many)
      └── Environment (many)
          └── Secret (many)
              └── SecretVersion[] (versioned encrypted values)
                  ├── ciphertext (encrypted secret value)
                  ├── iv (per-version random IV)
                  ├── authTag (authentication tag)
                  ├── keyVersion (which DEK version was used)
                  └── createdAt (version timestamp)
```

**Key insight**: All secrets in all projects within an org use the same wrapped DEK. This allows org-wide key rotation without re-encrypting individual secrets—only the DEK wrapper changes.

---

## 🤖 Agent Execution Context

### AgentSession Lifecycle
```
Project
  └── AgentSession (one or more per project)
      ├── id (cuid)
      ├── name (user-defined or auto: "Coding Task #1")
      ├── type (coding|content|ops|research)
      ├── status (idle → running → awaiting_approval|completed|failed)
      ├── prompt (system + user instructions)
      ├── daytonaSandboxId (if type=coding, linked Daytona sandbox)
      ├── sandboxUrl (preview URL for live web output)
      ├── currentTask (human-readable task being executed)
      ├── metadata (agent-specific config, state)
      └── timestamps (createdAt, updatedAt)
```

**Key insight**: An `AgentSession` is NOT the same as a `Task`. 
- **Task** = work item in a project (human-created, human-tracked)
- **AgentSession** = autonomous execution context (agent-managed state, tool calls, sandbox binding)

An agent can create/update tasks as part of its work, but the agent session itself tracks the agent's internal state.

---

## 📋 Task & Approval Flow

### Task Model
```
Project
  └── Task (one or more, human or agent-created)
      ├── id (cuid)
      ├── projectId (FK)
      ├── title (user-facing title)
      ├── description (markdown)
      ├── status (todo|in_progress|done)
      ├── assigneeId (User FK, can be null)
      ├── createdAt, updatedAt
      └── (Future) agentSessionId (link to originating agent session)
```

### Human-in-the-Loop Approval
When an agent proposes a high-risk action:

```
Agent proposes action
        ↓
proposeActionTool() → creates Audit Log entry with:
  - resourceType: "action_proposal"
  - status: "awaiting_approval"
  - payload: { actionType, targetSystem, description, riskLevel }
        ↓
UI renders action card for human review
        ↓
User approves or rejects
        ↓
API endpoint /api/agents/proposals/[proposalId]/approve
  - Triggers agentRuntimeContext execution
  - Records audit log: "action_executed" or "action_rejected"
```

---

## 🔌 Integration Storage

### Integration Model
```
Project
  └── Integration (one per provider per project)
      ├── id (cuid)
      ├── projectId (FK)
      ├── provider ("github"|"slack"|"vercel")
      ├── name (user-defined label)
      ├── accessTokenEncrypted (encrypted with org DEK)
      ├── refreshTokenEncrypted (encrypted with org DEK)
      ├── metadata (provider-specific config)
      ├── enabled (boolean)
      └── timestamps
```

**Key insight**: Tokens are encrypted with the org-level DEK, so if an org loses access to the DEK, all integrations become unreadable (security by design).

---

## 📊 Current Schema Status

| Entity | Exists | Notes |
|:---|:---|:---|
| Organization | ✅ | Complete with encryption key |
| Member | ✅ | RBAC role support |
| Project | ✅ | Core workspace unit |
| Environment | ✅ | Per-project environments |
| Secret / SecretVersion | ✅ | Full envelope encryption |
| Document | ✅ | Per-project content |
| Task | ✅ | Basic status tracking |
| Integration | ✅ | Encrypted token storage |
| AgentSession | ✅ | Tracks agent state & sandbox |
| AuditLog | ✅ | Comprehensive action tracking |
| AuditProposal | ❌ | TODO: explicit proposal record (currently in AuditLog metadata) |

---

## 🎯 Design Decisions Already Made

1. **Tasks are org-scoped, not global**: Each task belongs to exactly one project
2. **Secrets are per-environment**: Allows dev/staging/prod separation
3. **Integrations are per-project**: Different projects can connect to GitHub separately
4. **Agent sessions track sandbox state**: Links Daytona execution to project context
5. **All encryption uses org DEK**: Single key rotation point per org

---

## ⚠️ Open Questions

1. **Should AgentSession have explicit state history?** (e.g., logs of intermediate steps)
2. **Should Tasks be assignable to Agents or only to Users?** (for autonomous task delegation)
3. **Should Proposals be a first-class entity** or remain in AuditLog metadata?
4. **How should multi-agent collaboration work?** (multiple agents working on same project)

