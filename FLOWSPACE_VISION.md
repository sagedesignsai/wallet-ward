# 🌌 Flowspace — Product Vision & Strategic Architecture

> **"Convenience, Productivity, and Security — Delivered Autonomously."**

---

## 📖 1. The Origin & Problem Statement

### The Spark
Flowspace was born from a real-world developer pain point: a dead Linux filesystem caused a total loss of local project files and uncommitted `.env` configurations. While source code repositories could be re-cloned, **access to API keys, access tokens, and environment configurations was permanently lost.**

### The Initial Solution
The project began as an encrypted vault designed to securely back up credentials across projects and environments without pushing secrets to public or private git repositories.

### The Realization & Pivot
As the core codebase expanded to include multi-tenancy, project management, document editing, and task tracking, a broader ambition emerged: **building a Remote Workspace Platform.** 

However, attempting to build a system that *replaces* established platforms (Slack, Notion, Linear, GitHub, Figma) introduces friction. Teams and businesses love their existing tools. 

### The Core Breakthrough
> **"Don't build a system to REPLACE existing tools—build a system that AUGMENTS them autonomously."**

Flowspace shifts the workspace paradigm from passive tool storage to an **Autonomous Operations Engine**:
1. **Augment Existing Tools**: Agents use GitHub, Slack, Vercel, and Google Workspace on your behalf.
2. **Zero-Leak Security**: Credentials stay locked in an AES-256 encrypted vault; agents access APIs via server-side vault proxies.
3. **Autonomous Cloud Sandboxes**: Agents execute code, run builds, and generate live previews inside isolated **Daytona Cloud Sandboxes**.

---

## 🎯 2. The Core Strategic Vision

Flowspace is **The Autonomous Execution & Security Hub**. 

It sells **Convenience, Productivity, and Security** delivered by an autonomous workforce of specialized AI Agents operating under strict human-in-the-loop controls.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FLOWSPACE CORE ENGINE                          │
 └────────────────────────────────────────────────────────────────────────┘
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
  ⚡ 1. AUTONOMOUS RUNTIMES     🔒 2. SECURE VAULT           🔌 3. AUGMENTATION HUB
  • Daytona Cloud Sandboxes     • AES-256 Envelope Encryption • Connected Tools (GitHub/Slack)
  • 4 AI Agent Personas         • Server-Side Zero-Leak Proxy  • Workflow Triggers
  • Live Web Previews           • Full Audit Trail             • Human-in-the-Loop Approval
```

---

## 🏛️ 3. The 3-Pillar Platform Architecture

### Pillar 1: ⚡ Autonomous Runtimes (Agent Hub & Daytona Sandboxes)
- **Daytona Cloud Sandboxes**: Agents spin up isolated, cloud-hosted micro-environments to run `npm install`, execute builds, run tests, and serve live web previews.
- **ComputerPanel**: A multi-tab drawer inside the app rendering live terminal logs, file trees, syntax-highlighted code, markdown docs, and embedded iframe web previews.
- **Autonomous Task Queue**: Queued, running, and completed task states assigned to agents or human teammates.

### Pillar 2: 🔒 Secure Vault (Enterprise Encryption & Zero-Leak Proxy)
- **Envelope Encryption**: Organization-level Data Encryption Keys (DEKs) wrapped with AES-256-GCM. Secret values are versioned (`SecretVersion`) with unique initialization vectors (IVs) and Auth Tags.
- **8 Specialized Secret Types**: Environment Variables, Passwords (with strength generators), API Tokens (with expiration & scopes), SSH Keypairs (PEM validation), SSL/TLS Certificates, JSON configs, Binary Files, and Secure Notes.
- **Server-Side Vault Proxy (`/api/v1/agent-proxy`)**: When an agent invokes external APIs, secrets are attached server-side. Raw API keys are **never exposed** to browser UI, LLM prompts, or agent runtimes.

### Pillar 3: 🔌 Augmentation Hub (Tool Integration & HITL Controls)
- **Tool Connectors**: Agents interact directly with GitHub (open PRs), Vercel (trigger deployments), and Slack (post formatted update cards).
- **Human-in-the-Loop (HITL) Security**: High-risk actions (deploying to production, deleting resources, publishing public content) require explicit human approval via the **Propose → Approve → Execute** flow.

---

## 🤖 4. The 4 AI Agent Personas

Flowspace equips teams with 4 specialized, autonomous AI agent personas:

| Agent Persona | Role & Description | Primary Tools & Capabilities |
| :--- | :--- | :--- |
| ⌨️ **Coding Agent** | Builds, tests, and scaffolds apps inside isolated Daytona Sandboxes. Pushes code to GitHub and generates live previews. | Daytona SDK, GitHub PR Tool, Code Editor, Web Preview |
| ✍️ **Content Agent** | Drafts blog posts, newsletters, brand briefs, and product documentation using project context docs. | Document Creator, Markdown Editor, CMS Publisher |
| ⚙️ **Ops Agent** | Manages task boards, monitors deployment pipelines, sends Slack summaries, and enforces operational runbooks. | Slack Webhook Tool, Task Manager, Audit Search |
| 🔍 **Research Agent** | Gathers web intelligence, synthesizes competitor reports, summarizes documents, and prepares executive briefings. | Web Research, Document Parser, Summarizer |

---

## 🛡️ 5. Security & Human-in-the-Loop (HITL) Workflow

Flowspace balances high autonomy with enterprise security:

```
[ AI Agent Execution ]
         │
         ▼
[ High-Risk Action Detected? ]
   ├── NO  ➜ Execute directly (e.g. read docs, query tasks)
   └── YES ➜ Trigger HITL Proposal (proposeActionTool)
              │
              ▼
    [ Status: awaiting_approval ]
    [ Action Card Rendered in UI ]
              │
     ┌────────┴────────┐
     ▼                 ▼
[ USER APPROVES ]   [ USER REJECTS ]
     │                 │
     ▼                 ▼
Execute Action &   Cancel Execution &
Record Audit Log   Record Audit Log
```

---

## 💰 6. Commercial Viability & Monetization Model

Flowspace addresses both individual creators and enterprise engineering teams through a **Freemium B2B SaaS Model**:

1. **Free / Developer Tier ($0/mo)**:
   - 1 Autonomous Agent, 50 Vault secrets, 1 project, 7-day audit logs.
2. **Pro Tier ($19 / user / month)**:
   - 5 Autonomous Agents, unlimited secrets & projects, Daytona Cloud Sandboxes, GitHub / Slack / Vercel integrations, secret versioning, 90-day audit logs.
3. **Enterprise Tier ($49+ / user / month)**:
   - Unlimited Autonomous Agents, custom KMS / HSM key wrapping, SSO / SAML, SIEM audit log forwarding, 1-year log retention, dedicated SLA.

---

## 🚀 7. Summary Statement

Flowspace transforms the developer and business workspace from static tool storage into an **active, secure, autonomous force multiplier**. By backing up credentials safely in an encrypted vault and delegating tasks to Daytona-powered AI agents, teams achieve unprecedented speed without compromising security.
