"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type { UIMessage } from "ai"
import type { ComputerContent, FileNode } from "@/types/desktop/content"
import { openInWindow } from "@/lib/workspace/open-in-window"

// ─── Content types the Computer panel can display ────────────────────────────
// Re-exported from the desktop content types (single source of truth)

export type {
  ComputerContent,
  FileNode,
  DesktopContent,
  WebTerminalContent,
} from "@/types/desktop/content"

export type ComputerTabType =
  | "code"
  | "document"
  | "artifact"
  | "preview"
  | "terminal"
  | "secret"
  | "task"
  | "image"
  | "file-tree"
  | "desktop"
  | "web-terminal"

export interface ComputerTab {
  id: string
  type: ComputerTabType
  title: string
  /** Icon name from lucide (string key) */
  icon?: string
  /** The content payload — structure depends on type */
  content: ComputerContent
  /** Whether this tab is pinned (won't auto-close) */
  pinned?: boolean
  /** ISO timestamp when opened */
  openedAt: string
  /** Sandbox ID (for desktop/web-terminal tabs) */
  sandboxId?: string
}

// ─── Chat Session ─────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  title: string
  messages: UIMessage[]
  createdAt: string
  updatedAt: string
  /** Optional project context */
  projectId?: string
  environmentId?: string
  /** Agent type if launched from the workspace */
  agentType?: "coding" | "content" | "ops" | "research"
}

// ─── Store ────────────────────────────────────────────────────────────────────

function createSession(
  projectId?: string,
  environmentId?: string,
  agentType?: ChatSession["agentType"]
): ChatSession {
  const now = new Date().toISOString()
  const title = agentType
    ? `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`
    : "New conversation"
  return {
    id: nanoid(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
    projectId,
    environmentId,
    agentType,
  }
}

const defaultSession = createSession()

interface WorkspacePanelStore {
  chatOpen: boolean
  sessions: ChatSession[]
  activeSessionId: string | null
  /** Prompt to auto-send when the workspace panel mounts for a session */
  pendingPrompt: { sessionId: string; text: string } | null

  // Workspace mode (mobile tab toggle: "chat" | "canvas")
  workspaceMode: "chat" | "canvas"

  // Chat
  toggleChat: () => void
  openChat: () => void

  // Computer → desktop window bridge
  openTab: (tab: Omit<ComputerTab, "id" | "openedAt">) => void

  // Sessions
  newSession: (
    projectId?: string,
    environmentId?: string,
    agentType?: ChatSession["agentType"]
  ) => string
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  setPendingPrompt: (pendingPrompt: { sessionId: string; text: string } | null) => void
  syncSessionMessages: (sessionId: string, messages: UIMessage[]) => void

  // Agent
  launchAgent: (
    agentType: string,
    projectId?: string,
    environmentId?: string
  ) => string

  // Workspace mode
  setWorkspaceMode: (mode: "chat" | "canvas") => void
}

export const useWorkspacePanelStore = create<WorkspacePanelStore>()(
  persist(
    (set, get) => ({
      // ─── Initial state ────────────────────────────────────────────────────
      chatOpen: true,
      sessions: [defaultSession],
      activeSessionId: defaultSession.id,
      pendingPrompt: null,
      workspaceMode: "chat" as "chat" | "canvas",

      // ─── Chat ─────────────────────────────────────────────────────────────
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
      openChat: () => set({ chatOpen: true }),

      // ─── Computer → desktop window bridge ────────────────────────────────
      openTab: (tab) => {
        openInWindow(tab)
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          set({ workspaceMode: "canvas" })
        }
      },

      // ─── Sessions ─────────────────────────────────────────────────────────
      newSession: (projectId?, environmentId?, agentType?) => {
        const session = createSession(projectId, environmentId, agentType)
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.id,
        }))
        return session.id
      },

      selectSession: (sessionId) => set({ activeSessionId: sessionId }),

      deleteSession: (sessionId) => {
        const state = get()
        const sessions = state.sessions.filter((s) => s.id !== sessionId)
        const activeSessionId =
          state.activeSessionId === sessionId
            ? (sessions[0]?.id ?? null)
            : state.activeSessionId
        set({ sessions, activeSessionId })
      },

      setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),

      syncSessionMessages: (sessionId, messages) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess
            const firstUser = messages.find((m) => m.role === "user")
            const firstUserText = firstUser?.parts.find(
              (p): p is { type: "text"; text: string } => p.type === "text"
            )?.text
            return {
              ...sess,
              title:
                sess.title === "New conversation" && firstUserText
                  ? firstUserText.slice(0, 50)
                  : sess.title,
              messages,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ─── Agent ────────────────────────────────────────────────────────────
      launchAgent: (agentType, projectId?, environmentId?) => {
        const session = createSession(
          projectId,
          environmentId,
          agentType as ChatSession["agentType"]
        )
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.id,
          chatOpen: true,
        }))
        return session.id
      },

      // ─── Workspace mode ──────────────────────────────────────────────────
      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
    }),
    {
      name: "nimbus:workspace-panel",
      // Only persist sessions, panel toggle state, and workspace mode
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        chatOpen: state.chatOpen,
        workspaceMode: state.workspaceMode,
      }),
    }
  )
)
