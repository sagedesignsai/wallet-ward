# Permission Matrix & Access Control

## Overview

This document defines **who can do what** at each level of the Flowspace hierarchy:
- **Organization level** (managing teams, audit logs, encryption)
- **Project level** (managing workspaces, environments, integrations)
- **Resource level** (secrets, documents, tasks, agent sessions)

Permissions are role-based (RBAC) with inheritance from organization down to project scope.

---

## 1. Core Roles & Organization Level

### 1.1 Organization Roles

| Role | Level | Permissions | Notes |
|:---|:---|:---|:---|
| **owner** | Organization | All permissions (admin + member mgmt) | 1 per org minimum |
| **admin** | Organization | Project mgmt, integrations, audit logs, NOT member mgmt | Trusted team leads |
| **member** | Organization | Read projects, create/edit own docs | Default role |
| **guest** | Organization | Read-only access | Coming soon |

### 1.2 Organization-Level Permissions

```
Action                          | Owner | Admin | Member | Guest
─────────────────────────────────────────────────────────────────
Manage members (invite/remove)  |  ✅   |  ❌   |  ❌   |  ❌
Change org name/settings        |  ✅   |  ✅   |  ❌   |  ❌
Rotate encryption key (DEK)     |  ✅   |  ✅   |  ❌   |  ❌
View audit logs                 |  ✅   |  ✅   |  ❌   |  ❌
Export audit logs               |  ✅   |  ✅   |  ❌   |  ❌
Manage API keys                 |  ✅   |  ✅   |  ❌   |  ❌
Delete org                      |  ✅   |  ❌   |  ❌   |  ❌
```

---

## 2. Project-Level Permissions

### 2.1 Project Membership (Future Enhancement)

**Currently**: All org members can access all projects.

**Future**: Projects may have member-specific roles:
- `project_owner`: Full control of this project
- `project_editor`: Can modify project resources
- `project_viewer`: Read-only access

### 2.2 Project-Level Permissions

```
Action                                | Owner/Admin | Member | Guest
──────────────────────────────────────────────────────────────────
Create project                        |     ✅      |   ❌   |  ❌
Rename/edit project                   |     ✅      |   ❌   |  ❌
Delete project                        |     ✅      |   ❌   |  ❌
View project overview                 |     ✅      |   ✅   |  ✅
Create environment                    |     ✅      |   ❌   |  ❌
View environments                     |     ✅      |   ✅   |  ✅
Create secret (in env)                |     ✅      |   ✅   |  ❌
View secret names (not values)        |     ✅      |   ✅   |  ✅
Reveal/export secret values           |     ✅      |   ✅   |  ❌
Delete secret                         |     ✅      |   ❌   |  ❌
```

---

## 3. Secret Access Control

### 3.1 Secret Visibility Rules

**Secret Metadata** (name, type, description, created date):
- Visible to: Organization members

**Secret Values** (encrypted content, decrypted plaintext):
- **Can view**: Organization admins, project members with "reveal" permission
- **Cannot view**: Guests, agents (except via agentProxy with integration token)

### 3.2 Secret Operations

```
Operation                       | Admin | Member | Coding Agent | Content Agent | Ops Agent | Research
────────────────────────────────────────────────────────────────────────────────────────────────
List secret names              |  ✅   |   ✅   |      ✅      |       ❌      |    ✅     |    ❌
View secret metadata            |  ✅   |   ✅   |      ✅      |       ❌      |    ✅     |    ❌
Reveal secret value             |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
Export secrets (.env, JSON)     |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
Import secrets (bulk)           |  ✅   |   ❌   |      ❌      |       ❌      |    ❌     |    ❌
Create secret                   |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
Update secret                   |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
Delete secret                   |  ✅   |   ❌   |      ❌      |       ❌      |    ❌     |    ❌
Rotate secret version           |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
View secret version history     |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
Use secret via agentProxy       |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
```

### 3.3 How Agents Access Secrets (Zero-Leak Pattern)

**Direct access (❌ BLOCKED)**:
```typescript
// Agent CANNOT do this:
const token = await getSecretValue(secretId);  // Tool doesn't exist
```

**Indirect access (✅ ALLOWED)**:
```typescript
// Agent CAN do this:
const result = await agentProxy({
  projectId: "proj_123",
  service: "github",
  method: "POST",
  path: "/repos/owner/repo/pulls",
  body: { ... }
});
// Server handles:
// 1. Find GitHub integration in this project
// 2. Decrypt GitHub token from vault
// 3. Inject into Authorization header
// 4. Execute request
// 5. Return response (never the token)
```

---

## 4. Document Permissions

### 4.1 Document Access

```
Operation                       | Admin | Member | Coding Agent | Content Agent | Ops Agent | Research
────────────────────────────────────────────────────────────────────────────────────────────────
List documents                  |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ✅
View document content           |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ✅
Create document                 |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Edit document                   |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Delete document                 |  ✅   |   ❌   |      ❌      |       ❌      |    ❌     |    ❌
View version history            |  ✅   |   ✅   |      ❌      |       ❌      |    ❌     |    ❌
```

### 4.2 Document Creation by Agents

- **Coding Agent**: Creates technical docs, deployment guides, README
- **Content Agent**: Creates blog posts, newsletters, marketing materials
- **Ops Agent**: Creates runbooks, incident postmortems, operational logs
- **Research Agent**: Cannot create, only reads existing documents

---

## 5. Task Permissions

### 5.1 Task Operations

```
Operation                       | Admin | Member | Coding Agent | Content Agent | Ops Agent | Research
────────────────────────────────────────────────────────────────────────────────────────────────
List tasks                      |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ✅
View task details               |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ✅
Create task                     |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Assign task to user             |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Update task status              |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Update task description         |  ✅   |   ✅   |      ✅      |       ✅      |    ✅     |    ❌
Delete task                     |  ✅   |   ❌   |      ❌      |       ❌      |    ❌     |    ❌
```

### 5.2 Task Lifecycle

1. **Human creates task** → task starts in `todo` status
2. **Agent reads task** → agent understands work
3. **Agent creates subtasks** → agent tracks progress
4. **Agent updates status** → `todo` → `in_progress` → `done`
5. **Agent proposes approval** for high-risk tasks

---

## 6. Integration & Proxy Permissions

### 6.1 Integration Management

```
Operation                                   | Admin | Member | Agent
────────────────────────────────────────────────────────────────────────
Create integration (connect GitHub, etc)    |  ✅   |   ❌   |  ❌
View integration metadata (name, provider)  |  ✅   |   ✅   |  ✅
Reveal integration token/password           |  ✅   |   ❌   |  ❌
Rotate integration credentials              |  ✅   |   ✅   |  ❌
Delete integration                          |  ✅   |   ❌   |  ❌
Use integration via agentProxy              |  ✅   |   ✅   |  ✅
```

### 6.2 Agent Proxy Access Control

The `/api/v1/agent-proxy` endpoint enforces:

1. **Authentication**: Must have valid session
2. **Organization scope**: Agent & integration must belong to same org
3. **Project scope**: Integration must belong to requested project
4. **Integration enabled**: `integration.enabled = true`
5. **Rate limiting**: Per-integration or per-agent rate limits (future)

```typescript
// Example: Coding agent tries to use GitHub integration

// ✅ ALLOWED:
await agentProxy({
  projectId: "proj_123",        // Agent has access to this project
  service: "github",            // Integration exists in this project
  method: "POST",
  path: "/repos/owner/repo/pulls",
});

// ❌ DENIED (no integration):
await agentProxy({
  projectId: "proj_123",
  service: "slack",             // No Slack integration in this project
  ...
});

// ❌ DENIED (different org):
// Agent in Org A cannot use integration from Org B
```

---

## 7. Audit Log Permissions

### 7.1 Audit Log Access

```
Operation                       | Owner | Admin | Member | Guest | Agent
────────────────────────────────────────────────────────────────────────────
List org audit logs             |  ✅   |   ✅  |   ❌   |  ❌   |  ❌
Search audit logs               |  ✅   |   ✅  |   ❌   |  ❌   |  ❌
Filter by action/resource       |  ✅   |   ✅  |   ❌   |  ❌   |  ❌
Export audit logs               |  ✅   |   ✅  |   ❌   |  ❌   |  ❌
View agent action proposals     |  ✅   |   ✅  |   ✅   |  ❌   |  ❌
Approve/reject agent action     |  ✅   |   ✅  |   ✅   |  ❌   |  ❌
```

### 7.2 What Gets Logged

Every action (human or agent) is logged:

```typescript
AuditLog {
  organizationId: "org_123",
  action: "secret_create" | "task_update" | "agent_proxy_call" | "action_proposal_approved",
  resourceType: "secret" | "task" | "integration" | "action_proposal",
  resourceId: "sec_456",
  metadata: { /* action-specific data */ },
  actorType: "user" | "agent",      // Who performed the action
  actorUserId: "user_789",          // or null if agent
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/...",
  createdAt: "2024-06-15T10:30:00Z",
}
```

---

## 8. Agent Session Permissions

### 8.1 Agent Session Lifecycle

```
Operation                       | Owner/Admin | Member | Other Members | Guest
──────────────────────────────────────────────────────────────────────────────
Create agent session            |     ✅      |   ✅   |       ❌      |  ❌
View agent session              |     ✅      |   ✅   |       ✅      |  ❌
Pause/stop agent                |     ✅      |   ✅   |       ✅      |  ❌
View agent logs/output          |     ✅      |   ✅   |       ✅      |  ❌
Approve agent proposal          |     ✅      |   ✅   |       ✅      |  ❌
Delete agent session            |     ✅      |   ❌   |       ❌      |  ❌
```

### 8.2 Cross-Project Agent Access

**Current design**: Agents are scoped to a single project.

**Future consideration**: Should ops agents be org-level (view multiple projects)?

---

## 9. Encryption Key Access

### 9.1 Organization Encryption Key

```
Operation                                   | Owner | Admin | Member | Agent
────────────────────────────────────────────────────────────────────────────
Fetch org DEK (for decrypt operations)      |  ✅   |   ✅  |   ❌   |  ❌
Rotate org DEK                              |  ✅   |   ✅  |   ❌   |  ❌
Access wrappedDek from DB                   |  ✅   |   ✅  |   ❌   |  ❌
Decrypt secrets (via service layer)         |  ✅   |   ✅  |   ✅   |  ✅*
```

*Agents decrypt secrets only when accessed via agentProxy (server-side).

### 9.2 Key Rotation Impact

When an admin rotates the organization DEK:

```
Action                          | Impact
─────────────────────────────────────────────────────
Rotate wrappedDek               | New DEK version
New SecretVersions use new key  | keyVersion = 2
Old SecretVersions still work   | Can decrypt with old key
Decrypt pipeline auto-handles   | Checks keyVersion field
No secret value re-encryption   | Just wrapper changes
```

---

## 10. Special Cases & Edge Conditions

### 10.1 What Happens When a Member Leaves?

```
Member is removed from organization
  ↓
(Future) Any tasks assigned to them are reassigned or marked orphan
(Future) Any documents created by them remain but attribution is "removed user"
(Future) Audit logs still show their historical actions
Integration tokens they created are still accessible to other admins
```

### 10.2 What Happens When a Secret is Deleted?

```
Secret is deleted by admin
  ↓
All SecretVersions are cascade-deleted
Audit log records: action=secret_delete, resourceId=secret_123
(Future) If an agent was using it, agent receives error on next proxy call
  agent can propose fallback action or escalate
```

### 10.3 What If an Agent Tries to Access Another Org's Resources?

```
Agent in Org A requests: projectId from Org B
  ↓
Server queries: WHERE projectId = "proj_B" AND organizationId = "org_A"
  ↓
No match found
  ↓
Returns: 404 Not Found (or 403 Forbidden)
Audit log: Unauthorized access attempt (if logging is strict)
```

---

## 11. Implementation Checklist

- [x] Organization roles (owner, admin, member)
- [x] Organization member CRUD (invite, remove, update role)
- [x] Project CRUD permissions
- [x] Secret visibility (metadata vs values)
- [x] Integration token encryption
- [x] Audit logging for all actions
- [ ] Project-level member roles (future)
- [ ] Rate limiting per integration
- [ ] IP whitelisting for integrations (future)
- [ ] Secret access audit trail (who accessed which secret when)
- [ ] Agent action approval notifications
- [ ] Granular role permissions UI

---

## 12. Permission Enforcement Patterns

### Pattern 1: Org-Scoped Resources

```typescript
// Before returning a resource, ensure it belongs to user's org:
const resource = await prisma.secret.findFirst({
  where: {
    id: secretId,
    project: {
      organizationId: userContext.organizationId,  // ← Scoped
    },
  },
});
if (!resource) throw forbidden("Not found");
```

### Pattern 2: Role-Based Guards

```typescript
// Ensure user has required role:
requirePermission(userRole, "secret:reveal");  // ← Role check

// If check fails: throw forbidden("Insufficient permissions")
```

### Pattern 3: Tool Access by Agent Type

```typescript
// Register tool only for specific agent types:
if (agentType === "coding" || agentType === "ops") {
  registerTool(agentProxyTool);
}
```

---

## Summary Matrix: Quick Reference

### By Actor & Resource

```
Who              | Can List | Can View | Can Edit | Can Delete | Can Approve
─────────────────────────────────────────────────────────────────────────────
Org Owner        |    ✅    |    ✅    |    ✅    |     ✅     |     ✅
Org Admin        |    ✅    |    ✅    |    ✅    |     ✅     |     ✅
Org Member       |    ✅    |    ✅    |    ✅    |     ❌     |     ✅
Guest            |    ✅    |    ✅    |    ❌    |     ❌     |     ❌
Coding Agent     |    ✅    |    ✅    |    ✅*   |     ❌     |     N/A
Content Agent    |    ✅    |    ✅    |    ✅*   |     ❌     |     N/A
Ops Agent        |    ✅    |    ✅    |    ✅*   |     ❌     |     N/A
Research Agent   |    ✅    |    ✅    |    ❌    |     ❌     |     N/A
```

*Agents can edit tasks and documents they create, cannot edit others' resources.

