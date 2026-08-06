# Flowspace Implementation Plan: AI-Driven Creation Apps (App Engine)

## Overview

**Goal**: Turn Flowspace desktop windows into **AI-driven creation engines**. Each engine app (Slide Deck, Newsletter, …) is a desktop window backed by:

1. a persistent **Daytona sandbox** (template bootstrap → agent edits code),
2. an **engine agent** (restricted coding agent) that turns chat instructions into code changes and builds,
3. a **version-per-edit artifact** stored in project storage (R2 + `ProjectFile` version chain),
4. a **live window preview** that refreshes after every build.

The chat panel (or an embedded input in the engine window) is the control surface. Users tweak artifacts lightly in the window — the engine owns code generation, build, and iteration.

**Duration**: ~2 weeks part-time (Phases A–C), Phase D hardening ongoing.
**Status**: Ready for implementation.

---

## Design Basis (Research-Informed)

This plan maps prior research on in-browser "desktop OS" creation apps onto the existing Flowspace architecture:

| Research Finding | Source | Applied As |
|:---|:---|:---|
| Process-manager semantics for windowed apps | daedalOS (`DustinBrett/daedalOS`) | Already exists (`stores/desktop/window-manager.store.ts`); extended with engine-session ↔ window binding |
| Version-per-edit artifacts | E2B Fragments (`e2b-dev/ai-artifacts`), Open WebUI artifacts | `FileService.createVersion()` chain per build |
| Template registry (starter files + build command) | E2B Fragments `lib/templates.json` | Code-defined `lib/desktop/engines/templates.ts` |
| Agent tool-loop with sandbox feedback | Beam "agentic apps" loop; existing `ToolLoopAgent` | Engine agent = `ToolLoopAgent` with engine-scoped tools |
| Split "edit" tools vs "render" tools | OpenAI Apps SDK (data tools vs render tools) | `engineWriteFile`/`engineRunCommand` vs `engineBuild` (server-side artifact capture) |
| iframe-isolated artifact rendering | Anthropic Artifacts, Claude Design | `srcDoc` iframe with `sandbox` attrs, no `allow-same-origin` |
| Plan checkpoint before generation | Gamma outline checkpoint; existing `proposeAction` HITL | Engine emits plan → user confirms → build (Phase C) |
| Capability-token window messaging (future) | MCP Apps (`modelcontextprotocol/ext-apps`), Puter IPC | Phase D postMessage protocol |

Existing code already provides: window manager, app registry, message bus, typed window content, Daytona client, streaming chat route (`createUIMessageStreamResponse`), artifact storage + versioning, and a coding-agent app as a working reference for the engine pattern.

---

## Current State vs Target

### Already Built (reuse, don't rebuild)

| Building Block | Location |
|:---|:---|
| Window manager (open/focus/z-index/sanitize) | `stores/desktop/window-manager.store.ts` |
| App registry + manifests | `stores/desktop/app-registry.store.ts`, `types/desktop/app.ts` |
| System app registration | `lib/desktop/system-apps.ts` |
| Pub/sub message bus | `lib/desktop/message-bus.ts`, `types/desktop/events.ts` |
| App lifecycle hooks | `lib/desktop/app-lifecycle.ts` |
| Typed window content union | `types/desktop/content.ts` |
| Streaming agent chat (`ToolLoopAgent` + SSE) | `app/api/ai/chat/route.ts`, `lib/ai/agent.ts` |
| Coding agent + tool registry | `lib/ai/agents/coding-agent.ts`, `lib/ai/tools/` |
| Daytona client + preview helpers | `lib/daytona/` |
| Artifact storage + versioning | `lib/services/file-service.ts`, `lib/ai/tools/shared/create-artifact.ts`, `lib/storage/` |
| Artifact viewer window | `components/apps/artifact/index.tsx` |
| Sandbox window apps (preview/desktop/web-terminal) | `lib/desktop/system-apps.ts` (iframe kind, signed URLs, expiry) |
| Working reference: agent-in-a-window | `components/apps/coding-agent/` (dispatch-form, transcript, sandbox-views, status-bar) |

### Missing (this plan builds)

| Gap | Why It Matters |
|:---|:---|
| **Engine session model** — no DB record binding engine + project + sandbox + artifact head | Cannot persist app state, versions, or audit trail |
| **Engine template registry** — no code-defined starter files / build commands | Every new creation app would be bespoke |
| **Engine agent** — no restricted toolset or engine system prompt | Full coding agent would deploy/PR/Slack — wrong scope for a creation app |
| **Engine instructions endpoint** — no streaming route that runs the engine loop and captures artifacts | Chat and windows are loosely coupled today |
| **Engine window content type** — `WindowContent` union has no engine session payload | Windows can't carry engine state |
| **Version UI + live refresh** — artifact window is static (view/code toggle only) | No version-per-edit timeline, no status streaming |
| **Engine events** — message bus `AppEventType` has no engine events | Windows can't react to build progress |
| **Hardening** — artifact iframe currently `allow-scripts allow-same-origin` | Generated (untrusted) HTML should not share origin with the app |

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ DESKTOP (client)                                                     │
│                                                                     │
│  Chat panel ──(agentType:"engine", engineId, engineSessionId)──▶    │
│  EngineWindow (srcDoc preview + version timeline + status bar)      │
│      ▲  engine:status / engine:artifact (message bus)               │
└───────────────┬─────────────────────────────────────────────────────┘
                │ POST /api/ai/chat (streaming UI messages, SSE)
┌───────────────▼─────────────────────────────────────────────────────┐
│ ENGINE ROUTE (server)                                                │
│  buildAgentContext("engine") → createEngineAgent()                   │
│  ToolLoopAgent loop:                                                 │
│    engineWriteFile / engineReadFile / engineListFiles                │
│    engineRunCommand / engineBuild ────────────────┐                  │
└──────────────────────────────────────────────────┬┘                  │
                                                   ▼                  │
        ┌────────────────────────────┐   ┌─────────────────────────┐  │
        │ ENGINE SERVICE             │   │ DAYTONA SANDBOX          │  │
        │ ensureSandbox(engineKey)   │──▶│ starter files (template) │  │
        │ bootstrapTemplate()        │   │ npm install (once)       │  │
        │ captureArtifact():         │   │ app/ source files        │  │
        │   read built output        │◀──│ build (renderCommand)    │  │
        │   upload R2                │   └─────────────────────────┘  │
        │   ProjectFile create/      │                                │
        │     createVersion          │                                │
        │   update session head      │                                │
        └────────────┬───────────────┘                                │
                     ▼                                                │
        ┌─────────────────────────────┐  ┌─────────────────────────┐  │
        │ PROJECT STORAGE (R2 + DB)    │  │ AUDIT (AgentSession)    │  │
        │ artifact v1 ← v2 ← v3 chain  │  │ engine session + turns  │  │
        └─────────────────────────────┘  └─────────────────────────┘  │
```

**Loop per instruction**: user prompt → engine agent (edits code in sandbox, runs build) → server captures artifact version → message bus event → window refreshes preview + version timeline.

---

## Phase A — Engine Core (Schema, Registry, Types)

### Task A1: `AppEngineSession` Prisma model + migration

**File**: `prisma/schema.prisma`

```prisma
enum AppEngineStatus {
  idle
  initializing
  running
  building
  ready
  error
  stopped
}

model AppEngineSession {
  id             String          @id @default(cuid())
  engineKey      String          @map("engine_key")        // "slide-deck", "newsletter"
  projectId      String          @map("project_id")
  agentSessionId String?         @map("agent_session_id")  // AgentSession(type: engine)
  sandboxId      String?         @map("sandbox_id")        // Daytona sandbox
  status         AppEngineStatus @default(idle)
  title          String          @default("Untitled")
  currentFileId  String?         @map("current_file_id")   // head ProjectFile artifact
  currentVersion Int             @default(0)
  plan           String?         // pending plan awaiting user confirmation (Phase C)
  metadata       Json?
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")
  lastActiveAt   DateTime        @default(now()) @map("last_active_at")

  project      Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentSession AgentSession? @relation(fields: [agentSessionId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([engineKey])
  @@index([status])
  @@map("app_engine_session")
}
```

**Related edits**:
- `AgentType` enum: add `engine` (backward compatible — new value only; enables engine-labeled agent sessions in the audit trail).
- `Project` model: add `engineSessions AppEngineSession[]`.
- `AgentSession` model: add `engineSessions AppEngineSession[]`.

**Effort**: 1h

**Checklist**:
- [ ] Schema updated
- [ ] Migration created: `pnpm exec prisma migrate dev --name add_app_engine_session` (use `pnpm db:migrate`)
- [ ] `pnpm db:generate`
- [ ] `engine` value present in generated `AgentType`

---

### Task A2: Engine template registry + types

**Files**:
- `types/desktop/engine.ts` (NEW)
- `types/desktop/content.ts` (edit — add `EngineSessionContent` to the union)
- `types/desktop/events.ts` (edit — add engine event types)
- `lib/desktop/engines/templates.ts` (NEW)

**`types/desktop/engine.ts`**:

```typescript
export type EngineTemplate = {
  key: string // "slide-deck"
  name: string
  description: string
  category: string
  icon: string // phosphor icon name
  /** Starter files: relative path → file content. Written into the sandbox on first run. */
  starterFiles: Record<string, string>
  /** One-time setup command (e.g. "npm install") */
  bootstrapCommand?: string
  /** Build command that produces the artifact (e.g. "npm run build") */
  renderCommand: string
  /** Relative path(s) of the built output(s) to capture as the artifact */
  renderOutputs: string[]
  /** Sandbox working directory for the app source */
  appDir: string // "/workspace/app"
}

export type EngineSessionDto = {
  id: string
  engineKey: string
  projectId: string
  agentSessionId: string | null
  sandboxId: string | null
  status: "idle" | "initializing" | "running" | "building" | "ready" | "error" | "stopped"
  title: string
  currentFileId: string | null
  currentVersion: number
  plan: string | null
  createdAt: string
  updatedAt: string
}
```

**`types/desktop/content.ts`** — add to the `WindowContent` union:

```typescript
export interface EngineSessionContent {
  type: "engine-session"
  engineKey: string
  engineSessionId: string
  projectId: string
  sandboxId?: string
  artifactId?: string
  /** Rendered artifact HTML for srcDoc preview (snapshot mode) */
  html?: string
  /** Live signed preview URL (Phase C) */
  previewUrl?: string
  status?: string
  title?: string
}
```

**`types/desktop/events.ts`** — extend `AppEventType`:

```typescript
| "engine:status"    // { engineSessionId, engineKey, status, step? }
| "engine:artifact"  // { engineSessionId, fileId, version, previewUrl? }
| "engine:plan"      // { engineSessionId, plan }  (Phase C)
```

**`lib/desktop/engines/templates.ts`** — two MVP templates (inline starter files):

```typescript
import type { EngineTemplate } from "@/types/desktop/engine"

export const ENGINE_TEMPLATES: EngineTemplate[] = [
  {
    key: "slide-deck",
    name: "Slide Deck",
    description: "Build presentation decks as HTML slides",
    category: "Creation",
    icon: "PresentationChartIcon",
    appDir: "/workspace/app",
    starterFiles: {
      "index.html": "<!doctype html><html><head><meta charset=\"utf-8\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><section class=\"slide\"><h1>My Deck</h1></section><script src=\"app.js\"></script></body></html>",
      "styles.css": "body{margin:0;font-family:system-ui} .slide{min-height:100vh;display:flex;align-items:center;justify-content:center}",
      "app.js": "",
    },
    bootstrapCommand: undefined,
    renderCommand: "cp index.html dist/index.html && cp styles.css dist/styles.css && cp app.js dist/app.js",
    renderOutputs: ["dist/index.html", "dist/styles.css", "dist/app.js"],
  },
  {
    key: "newsletter",
    name: "Newsletter",
    description: "Draft and style email newsletters from markdown",
    category: "Creation",
    icon: "EnvelopeIcon",
    appDir: "/workspace/app",
    starterFiles: {
      "draft.md": "# Hello\n\nWrite your newsletter here.",
      "template.html": "<!doctype html><html><body>__CONTENT__</body></html>",
    },
    bootstrapCommand: undefined,
    renderCommand: "npm run render", // small node script provided at bootstrap
    renderOutputs: ["dist/index.html"],
  },
]

export function getEngineTemplate(key: string): EngineTemplate | undefined {
  return ENGINE_TEMPLATES.find((t) => t.key === key)
}
```

**Effort**: 3h (types + 2 templates + wiring)

**Checklist**:
- [ ] `EngineSessionContent` in the `WindowContent` union; no type errors in window manager
- [ ] `sanitizeWindowForStorage` fallback set (`IFRAME_APP_IDS` in `window-manager.store.ts`) includes `"engine-session"` so signed `previewUrl`/`html` never persist
- [ ] Engine events added to `AppEventType`
- [ ] Two templates defined; bootstrap scripts for `newsletter` render documented

---

### Task A3: Engine window shell + app registration

**Files**:
- `components/apps/engine/engine-window.tsx` (NEW)
- `components/apps/engine/engine-status-bar.tsx` (NEW)
- `lib/desktop/system-apps.ts` (edit — register one engine app per template)

**`engine-window.tsx`** (sketch):

```tsx
"use client"

import { useSubscribe } from "@/lib/desktop/message-bus"
import type { AppProps } from "@/types/desktop/app"
import type { EngineSessionContent } from "@/types/desktop/content"

export function EngineWindow({ windowId, content }: AppProps) {
  const session = content as EngineSessionContent | undefined
  const [html, setHtml] = useState(session?.html)
  const [status, setStatus] = useState(session?.status ?? "idle")

  // Live status + artifact refresh via the existing pub/sub bus
  useSubscribe("engine:status", (m) => {
    const p = m.payload as { engineSessionId: string; status: string }
    if (p.engineSessionId === session?.engineSessionId) setStatus(p.status)
  })
  useSubscribe("engine:artifact", (m) => {
    const p = m.payload as { engineSessionId: string; html?: string; previewUrl?: string }
    if (p.engineSessionId === session?.engineSessionId) {
      if (p.html) setHtml(p.html)
      // Phase C: refresh signed preview URL via /preview endpoint when previewUrl present
    }
  })

  return (
    <div className="flex h-full flex-col">
      <EngineStatusBar status={status} />
      {html ? (
        <iframe
          srcDoc={html}
          title="Engine preview"
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-popups" // NO allow-same-origin — generated HTML is untrusted
        />
      ) : (
        <p className="text-sm italic text-muted-foreground p-4">
          Ask the engine to build something — the preview appears here.
        </p>
      )}
    </div>
  )
}
```

**Registration** in `lib/desktop/system-apps.ts` (loop over templates):

```typescript
import { ENGINE_TEMPLATES } from "@/lib/desktop/engines/templates"
import { EngineWindow } from "@/components/apps/engine/engine-window"

for (const t of ENGINE_TEMPLATES) {
  register({
    id: `engine-${t.key}`,
    name: t.name,
    icon: t.icon,
    description: t.description,
    category: t.category,
    kind: "component",
    component: EngineWindow,
    hidden: false,
    defaultSize: { width: 900, height: 640 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    singleInstance: false,
    dedupeKey: (c) =>
      (c as EngineSessionContent).engineSessionId ?? undefined,
  })
}
```

**Effort**: 3h

**Checklist**:
- [ ] Engine apps launch from the app launcher / desktop icons
- [ ] `EngineSessionContent` windows open with correct dedupe per session
- [ ] Status bar shows `initializing → building → ready`
- [ ] `sanitizeWindowForStorage` strips signed fields on engine windows

---

## Phase B — Engine Runtime (Sandbox, Agent, API)

### Task B1: Engine service

**File**: `lib/services/app-engine-service.ts` (NEW)

Responsibilities (all org/project-scoped, mirroring existing service patterns):

```typescript
import { db } from "@/lib/db"
import { notFound, forbidden } from "@/lib/api/errors"
import { getEngineTemplate } from "@/lib/desktop/engines/templates"
import { writeAuditLog } from "@/lib/services/audit"
import { requireClient } from "@/lib/daytona" // + lifecycle/preview helpers

export class AppEngineService {
  /** Create session (+ AgentSession for audit); sandbox is created lazily */
  static async createSession(ctx, projectId, engineKey, title?) { … }

  /** Ensure a Daytona sandbox exists for the session; bootstrap template files */
  static async ensureSandbox(engineSessionId): Promise<{ sandboxId: string }> { … }

  /** Run a command in the session sandbox's appDir */
  static async runCommand(engineSessionId, command): Promise<{ exitCode: number; stdout: string; stderr: string }> { … }

  /** Read a file from the session sandbox */
  static async readFile(engineSessionId, path): Promise<string> { … }

  /** List files in the session sandbox appDir */
  static async listFiles(engineSessionId, path?): Promise<FileNode[]> { … }

  /** Build + capture: run renderCommand, read outputs, upload R2, create ProjectFile version */
  static async buildAndCapture(engineSessionId, context): Promise<{ fileId: string; version: number; html: string }> { … }

  /** Resolve live signed preview URL (Phase C) */
  static async getPreview(engineSessionId): Promise<{ url: string; token?: string }> { … }
}
```

Key behaviors:
- `ensureSandbox`: if `session.sandboxId` exists and is running, reuse (persistent per-session sandbox — research finding: "one persistent Daytona sandbox per app instance"). Otherwise create via `requireClient()`/lifecycle helpers, then write `starterFiles` and run `bootstrapCommand` once. Store `sandboxId` on the session.
- `buildAndCapture`: run `renderCommand` in `appDir`; read each path in `renderOutputs`; join HTML output; upload via `lib/storage` (`uploadBuffer`/`buildObjectKey`, enforce `MAX_FILE_SIZE` — same pattern as `create-artifact.ts`); then:
  - version 1: `FileService.create({ type: "artifact", … })`
  - version N: `FileService.createVersion(session.currentFileId, { … })`
  - update `session.currentFileId`, `currentVersion`, `status: "ready"`, `lastActiveAt`
- Every engine action writes an audit log entry (`writeAuditLog`, `resourceType: "app_engine_session"`).
- All reads verify the session's `project.organizationId === ctx.organizationId` → else `notFound()`.

**Effort**: 5h

**Checklist**:
- [ ] `createSession` persists session + AgentSession(type: `engine`)
- [ ] `ensureSandbox` bootstraps template files exactly once (idempotent — marker file or `metadata.bootstrapDone`)
- [ ] `buildAndCapture` produces a v1 artifact on first build, `createVersion` chain after
- [ ] R2 objects are org-project namespaced (reuse `buildObjectKey`)
- [ ] Audit logs on create/build/capture
- [ ] Org-boundary checks on every method

---

### Task B2: Engine agent + engine tools

**Files**:
- `lib/ai/tools/engines/engine-write-file.ts` (NEW)
- `lib/ai/tools/engines/engine-read-file.ts` (NEW)
- `lib/ai/tools/engines/engine-list-files.ts` (NEW)
- `lib/ai/tools/engines/engine-run-command.ts` (NEW)
- `lib/ai/tools/engines/engine-build.ts` (NEW)
- `lib/ai/tools/index.ts` (edit — export engine tools)
- `lib/ai/agents/engine-agent.ts` (NEW)
- `lib/ai/context-builders.ts` (edit — `buildEngineAgentContext` + `buildAgentContext` case)

**Tool contract** — all engine tools use `contextSchema: { organizationId, userId, engineSessionId, projectId? }` and delegate to `AppEngineService`. The engine session id is resolved from context (never from user input):

```typescript
// lib/ai/tools/engines/engine-write-file.ts
export const engineWriteFileTool = tool({
  description:
    "Write a file into the app's source directory in the engine sandbox. Paths are relative to the app root (e.g. 'index.html').",
  inputSchema: z.object({
    path: z.string().describe("Relative path, e.g. 'index.html' or 'styles.css'"),
    content: z.string().describe("Full file content"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    userId: z.string(),
    engineSessionId: z.string(),
  }),
  execute: async ({ path, content }, { context }) => {
    // 1. Resolve session; verify org boundary (else notFound)
    // 2. AppEngineService.writeFile(context.engineSessionId, path, content)
    // 3. writeAuditLog
    return { path, bytes: Buffer.byteLength(content) }
  },
})
```

`engineBuildTool` — runs `renderCommand` and triggers capture, returns the artifact manifest to the model:

```typescript
export const engineBuildTool = tool({
  description: "Run the app's build command and save a new artifact version. Call after edits are complete.",
  inputSchema: z.object({}),
  contextSchema: z.object({
    organizationId: z.string(),
    userId: z.string(),
    engineSessionId: z.string(),
  }),
  execute: async (_input, { context }) => {
    const { fileId, version, html, buildLog } = await AppEngineService.buildAndCapture(
      context.engineSessionId,
      context
    )
    return {
      fileId,
      version,
      status: "ready",
      buildLog,
      htmlSnippet: html.slice(0, 2000), // keep the model informed, not flooded
    }
  },
})
```

**`lib/ai/agents/engine-agent.ts`** — mirrors `createCodingAgent` with a restricted toolset (no deploy / GitHub PR / Slack / Vercel / computer-use / desktop) and an engine-specific prompt:

```typescript
export const engineAgentTools = {
  engineWriteFile: engineWriteFileTool,
  engineReadFile: engineReadFileTool,
  engineListFiles: engineListFilesTool,
  engineRunCommand: engineRunCommandTool,
  engineBuild: engineBuildTool,
} as const

export function createEngineAgent(options: EngineAgentOptions) {
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: buildEngineInstructions(), // template-aware, injected below
    tools: engineAgentTools,
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(30),
  })
}
```

Engine system prompt (core rules):
- You are the engine for `<template.name>`. Source lives in the sandbox at `<appDir>`.
- Starter files: `<list from template>`.
- Edit files with `engineWriteFile`, inspect with `engineReadFile`/`engineListFiles`, run shell commands with `engineRunCommand` (scoped to appDir).
- When the app is ready, call `engineBuild` — it saves the artifact version and refreshes the preview.
- Iterate on build errors: read the error, fix, rebuild.
- Scope guard: never deploy, never touch other sandboxes, never use external credentials.

**Context builder** (`lib/ai/context-builders.ts`):

```typescript
export function buildEngineAgentContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string; engineSessionId?: string }
) {
  const shared = { organizationId, projectId: options?.projectId }
  return {
    engineWriteFile: { ...shared, engineSessionId: options?.engineSessionId },
    engineReadFile: { ...shared, engineSessionId: options?.engineSessionId },
    engineListFiles: { ...shared, engineSessionId: options?.engineSessionId },
    engineRunCommand: { ...shared, engineSessionId: options?.engineSessionId },
    engineBuild: { ...shared, engineSessionId: options?.engineSessionId },
  }
}
```

**`lib/ai/agent.ts`** — add `case "engine": return createEngineAgent(...)`.

**Effort**: 5h

**Checklist**:
- [ ] All five tools verify org boundary + engine session ownership
- [ ] Engine agent constructed with only engine tools (access enforced at construction — matches repo pattern)
- [ ] `buildAgentContext("engine", …)` returns the correct context map
- [ ] Model sees build errors and can iterate (test with a deliberate bug in starter files)

---

### Task B3: Engine API routes

**Files**:
- `app/api/engines/route.ts` (NEW — list templates: `GET /api/engines`)
- `app/api/engines/sessions/route.ts` (NEW — `POST /api/engines/sessions` create)
- `app/api/engines/sessions/[sessionId]/route.ts` (NEW — `GET` detail, `PATCH` title/status)
- `app/api/engines/sessions/[sessionId]/artifact/route.ts` (NEW — `GET` latest artifact HTML for srcDoc; org-scoped)
- `app/api/engines/sessions/[sessionId]/artifacts/route.ts` (NEW — `GET` version history from `FileService.getVersions`)
- `app/api/engines/sessions/[sessionId]/preview/route.ts` (NEW — `POST` resolve signed preview URL, Phase C)
- `app/api/ai/chat/route.ts` (edit — accept `engineId`/`engineSessionId` in body, route to engine agent)

**Chat route extension** (reuses all existing streaming, session, error mapping):

```typescript
// body: { messages, projectId, agentType: "engine", engineId, engineSessionId }

// 1. Validate engineSessionId belongs to the org + project (else 403)
// 2. agentType "engine" → buildEngineAgentContext(..., { engineSessionId })
// 3. createAgent("engine", { toolsContext, runtimeContext })
// 4. Stream via createUIMessageStreamResponse (unchanged)
```

Agent session naming: `resolveAgentSession` already names sessions from `agentType` — engine sessions get `"engine agent session"` and the `X-Agent-Type: engine` header. The engine route additionally updates `AppEngineSession.status: running → ready/error` and emits `engine:status` + `engine:artifact` bus events — but the bus is client-side; server emits via the streaming response and the client hook re-broadcasts. Simplest MVP: the chat client (see Task B4) reads the final tool results (`engineBuild` result carries `fileId`/`version`) and emits bus events itself; a server event source is Phase C.

**Effort**: 5h

**Checklist**:
- [ ] `POST /api/engines/sessions` creates session + AgentSession, returns DTO
- [ ] `GET /api/engines` returns template registry (id/name/description/category)
- [ ] `GET .../artifact` returns latest artifact HTML with org/project permission check
- [ ] `GET .../artifacts` returns version chain (v1, v2, …)
- [ ] Chat route with `agentType: "engine"` streams UI messages end-to-end
- [ ] Error paths: unknown engineKey → 400; foreign session → 403/404

---

### Task B4: Wire the control surface

**Files**:
- `components/apps/engine/engine-prompt.tsx` (NEW — embedded prompt input, mirrors `components/apps/coding-agent/dispatch-form.tsx`)

**MVP decision**: each engine window embeds its own prompt input + turn transcript (consistent with the existing coding-agent app). Global-chat routing by focused window is a Phase C enhancement.

**`engine-prompt.tsx`** (sketch):

```tsx
"use client"

// useChat from @ai-sdk/react with a custom body:
//   { messages, projectId, agentType: "engine", engineId, engineSessionId }
// On each assistant message, scan tool parts:
//   - engineBuild result { fileId, version } → messageBus.send({
//       from: "engine", to: "*", type: "engine:artifact", payload: { engineSessionId, fileId, version } })
//   - progress parts → engine:status
// Render turn transcript with MessageRenderer (existing component).
```

**Effort**: 4h

**Checklist**:
- [ ] Typing in an engine window runs the engine loop; streaming text/tool progress renders
- [ ] `engine:artifact` event refreshes the window preview (srcDoc)
- [ ] Build errors surface in the transcript and the agent fixes + rebuilds
- [ ] Multiple engine windows run independent sessions (dedupe by session id)

---

## Phase C — UX (Versions, Preview, Plan Checkpoint)

### Task C1: Version timeline UI

**File**: `components/apps/engine/engine-versions.tsx` (NEW)

- On open, `GET .../artifacts` → version list (v1…vN, timestamp, size).
- Click version → `GET .../artifact?versionId=` → renders that snapshot in the preview (read-only restore preview; actual restore reuses `FileService.restoreVersionWithKey` pattern if wanted — Phase D).
- Active version badge in the status bar.

**Effort**: 3h

### Task C2: Live preview via signed URL

**File**: `lib/desktop/system-apps.ts` (edit — preview integration in engine window)

- Phase C mode: after `engineBuild`, the window calls `POST .../preview` → signed URL (existing `lib/daytona/preview.ts` + `IframeAppShell` pattern with `expiry` + `onRefresh`).
- Fallback to snapshot srcDoc when a live preview isn't available.
- Signed URL/token stripped by `sanitizeWindowForStorage` (Task A2).

**Effort**: 3h

### Task C3: Global chat → focused window routing

**File**: `components/workspace/ai-chat-panel.tsx` (edit)

- When `focusedWindow.content.type === "engine-session"`, the chat submit adds `engineId`/`engineSessionId` to the request body and shows an "Engine: Slide Deck" badge (reuse `AGENT_TYPE_LABELS`-style mapping).
- Otherwise, existing behavior unchanged.

**Effort**: 3h

### Task C4: Plan checkpoint (Gamma-style)

**Files**:
- `lib/ai/agents/engine-agent.ts` (edit — instructions: emit a plan first)
- `app/api/engines/sessions/[sessionId]/plan/route.ts` (NEW — `POST` confirm/cancel)
- `components/apps/engine/engine-plan-card.tsx` (NEW)

- First instruction on a session: engine agent produces an outline (sections/slides) and stores it via `engineBuild`-style server step → `session.plan` populated; window shows a confirm card (mirrors `proposeAction` UX).
- `POST .../plan { approved: true }` sets `metadata.planConfirmed`; subsequent instructions build directly.
- Skip this gate when the user explicitly asks for an immediate build.

**Effort**: 4h

---

## Phase D — Hardening

### Task D1: Iframe security

- Change artifact previews (`components/apps/artifact/index.tsx`, engine window) from `sandbox="allow-scripts allow-same-origin"` to `sandbox="allow-scripts allow-popups"` — generated HTML must not share origin with the app.
- Add `Content-Security-Policy` headers on the artifact-serving route (`frame-ancestors`, `sandbox`).
- Verify clipboard/`allow` attributes on engine iframes.

### Task D2: Engine lifecycle & cleanup

- Idle timeout: `lastActiveAt` older than N hours → status `stopped`, sandbox torn down (existing `lib/daytona/lifecycle.ts`).
- `stop`/`delete` endpoints + desktop context-menu integration.
- Optional DB-backed `AppEngine` table (per-org enable/disable, custom templates) if code-defined registry proves limiting.

### Task D3: More templates + renderers

- Templates: `report`, `landing-page`, `dashboard`.
- Renderers: PDF via headless print in sandbox, PNG via screenshot — captured through the same `buildAndCapture` path (`renderOutputs` already supports multiple files; MIME derives from extension).

### Task D4: Capability-token postMessage protocol (optional)

- MCP-Apps-style JSON-RPC over `postMessage` between engine window iframes and the parent: `ui://engine:<sessionId>`, capability token per window, `callServerTool` equivalents (`engineBuild`, `getVersion`, …).
- Reuses `messageBus` on the parent side.

### Task D5: Housekeeping

- Add this document to `docs/architecture/ARCHITECTURE_INDEX.md`.
- Note the `engine` AgentType + new events in `ARCHITECTURE_01_DATA_MODEL.md` and `types/desktop/events.ts` docs.

---

## Timeline

| Phase | Tasks | Effort | Days |
|:---|:---|:---:|:---:|
| A — Engine Core | A1–A3 (schema, templates, window shell) | 7h | 2–3 |
| B — Engine Runtime | B1–B4 (service, agent, API, control surface) | 19h | 4–5 |
| C — UX | C1–C4 (versions, preview, routing, plan gate) | 13h | 3–4 |
| D — Hardening | D1–D5 | 10h+ | 2–3 (ongoing) |
| **Total** | | **~49h** | **~2 weeks** |

## Success Criteria

### Functionality
- [ ] One prompt in an engine window produces a working slide deck / newsletter, rendered in-window
- [ ] Every instruction creates a new artifact version; version list is browsable
- [ ] Build errors are visible in the transcript and the agent fixes and rebuilds
- [ ] Multiple engine sessions run independently (per-session sandbox, per-session version chain)
- [ ] Plan checkpoint gates the first build (Phase C)

### Quality
- [ ] Instruction → artifact ≤ ~30s for small decks (sandbox warm; excludes model latency variance)
- [ ] No regressions in the existing coding-agent app or chat route
- [ ] Typecheck clean (`tsc --noEmit`) — run only after plan is fully implemented, per project convention

### Security
- [ ] All engine endpoints org/project-scoped; foreign session → 403/404
- [ ] Signed URLs/tokens never persisted (sanitize path verified)
- [ ] Engine iframes never run with `allow-same-origin`
- [ ] Engine agent has no deploy/PR/Slack/credential tools (enforced at construction)
- [ ] Full audit trail: session create, turns, builds, artifact versions

## Risks & Mitigation

| Risk | Impact | Mitigation |
|:---|:---:|:---|
| Sandbox boot latency makes MVP feel slow | 🟡 Med | Lazy warm on session create (not first instruction); reuse persistent sandbox per session |
| Model writes files outside `appDir` | 🟡 Med | `engineWriteFile` rejects absolute/`..` paths; `engineRunCommand` prepends `cd <appDir> &&` |
| Artifact capture grows R2 storage | 🟡 Med | Cap artifact size (`MAX_FILE_SIZE`), prune old versions in Phase D |
| Build tool runs forever | 🟡 Med | Timeout on `renderCommand` (e.g. 120s) + abortSignal from agent loop |
| Generated HTML exfiltrates data | 🔴 High | No `allow-same-origin`; CSP on artifact route; no credentials in iframe (zero-leak pattern already prevents this) |
| Engine agent wanders into general chat scope | 🟡 Med | Restricted toolset + engine prompt; runtime check `runtimeContext.agentType === "engine"` in engine tools |

## Open Questions

1. **Control surface**: embedded engine prompt (MVP, chosen) vs global chat routing (Phase C)? — Recommendation: MVP as planned; revisit after dogfooding.
2. **Render mode default**: snapshot artifact (srcDoc) vs live sandbox preview? — Recommendation: snapshot MVP, live preview Phase C.
3. **Add `engine` to `AgentType` enum?** — Recommendation: yes (audit clarity); backward compatible.
4. **Template storage**: code-defined registry vs DB `AppEngine` table? — Recommendation: code-defined MVP; DB if per-org customization is requested.
5. **Artifact formats**: HTML-only MVP sufficient? PDF/images deferred to Phase D renderers? — Recommendation: yes.

## Sources

- E2B Fragments / ai-artifacts: `github.com/e2b-dev/ai-artifacts` (Next.js + Server Actions + sandbox SDK, template registry, version-per-edit)
- daedalOS: `github.com/DustinBrett/daedalOS` (process-manager window semantics)
- Anthropic Artifacts write-up (Pragmatic Engineer): iframe sandbox + full-site isolation
- MCP Apps spec: `github.com/modelcontextprotocol/ext-apps` (ui:// resources, postMessage JSON-RPC, capability tokens)
- OpenAI Apps SDK (DevDay 2025): data tools vs render tools
- Beam "agentic apps" architecture: `beam.cloud/blog/agentic-apps` (model client + sandbox + agent loop + realtime frontend)
- Gamma / Canva AI / Figma AI product analysis: plan checkpoint, editable artifacts, design-system context, version history

---

**Document Version**: 1.0
**Created**: 2026-08-05
**Status**: Ready for review — resolves to `docs/architecture/ARCHITECTURE_04_DECISIONS.md` open questions after team review
