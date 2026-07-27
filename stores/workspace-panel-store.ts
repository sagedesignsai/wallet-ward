"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

// ─── Content types the Computer panel can display ────────────────────────────

export type ComputerTabType =
  | "code"
  | "document"
  | "artifact"
  | "preview"
  | "terminal"
  | "secret"
  | "task"
  | "image"
  | "file-tree";

export interface ComputerTab {
  id: string;
  type: ComputerTabType;
  title: string;
  /** Icon name from lucide (string key) */
  icon?: string;
  /** The content payload — structure depends on type */
  content: ComputerContent;
  /** Whether this tab is pinned (won't auto-close) */
  pinned?: boolean;
  /** ISO timestamp when opened */
  openedAt: string;
}

// ─── Content payloads per type ───────────────────────────────────────────────

export type ComputerContent =
  | CodeContent
  | DocumentContent
  | ArtifactContent
  | PreviewContent
  | TerminalContent
  | SecretContent
  | TaskContent
  | ImageContent
  | FileTreeContent;

export interface CodeContent {
  type: "code";
  code: string;
  language: string;
  filename?: string;
  /** If tied to a DB record */
  resourceId?: string;
}

export interface DocumentContent {
  type: "document";
  title: string;
  body: string; // markdown / rich text
  resourceId?: string;
  projectId?: string;
  editable?: boolean;
}

export interface ArtifactContent {
  type: "artifact";
  title: string;
  description?: string;
  code?: string;
  language?: string;
  /** Rendered HTML string for preview */
  html?: string;
}

export interface PreviewContent {
  type: "preview";
  url: string;
  title?: string;
}

export interface TerminalContent {
  type: "terminal";
  lines: string[];
  title?: string;
}

export interface SecretContent {
  type: "secret";
  name: string;
  secretType: string;
  resourceId: string;
  projectId: string;
  environmentId: string;
}

export interface TaskContent {
  type: "task";
  title: string;
  description?: string;
  status: string;
  resourceId: string;
  projectId: string;
}

export interface ImageContent {
  type: "image";
  url: string;
  alt?: string;
}

export interface FileTreeContent {
  type: "file-tree";
  title: string;
  /** Recursive tree structure */
  tree: FileNode[];
  /** Initially selected path */
  selectedPath?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string;
  children?: FileNode[];
}

// ─── Chat Session ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** Optional project context */
  projectId?: string;
  environmentId?: string;
  /** Agent type if launched from Agent Hub */
  agentType?: "coding" | "content" | "ops" | "research";
}

// ─── Store ────────────────────────────────────────────────────────────────────

function createSession(
  projectId?: string,
  environmentId?: string,
  agentType?: ChatSession["agentType"],
): ChatSession {
  const now = new Date().toISOString();
  const title = agentType
    ? `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`
    : "New conversation";
  return {
    id: nanoid(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
    projectId,
    environmentId,
    agentType,
  };
}

const defaultSession = createSession();

interface WorkspacePanelStore {
  chatOpen: boolean;
  computerOpen: boolean;
  tabs: ComputerTab[];
  activeTabId: string | null;
  sessions: ChatSession[];
  activeSessionId: string | null;

  // Chat
  toggleChat: () => void;
  openChat: () => void;

  // Computer
  toggleComputer: () => void;
  openComputer: () => void;
  openTab: (tab: Omit<ComputerTab, "id" | "openedAt">) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;

  // Sessions
  newSession: (
    projectId?: string,
    environmentId?: string,
    agentType?: ChatSession["agentType"],
  ) => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  addMessage: (
    sessionId: string,
    message: Omit<ChatMessage, "id" | "createdAt">,
  ) => void;

  // Terminal
  appendTerminalLines: (tabId: string, lines: string[]) => void;

  // Agent
  launchAgent: (agentType: string) => void;
}

export const useWorkspacePanelStore = create<WorkspacePanelStore>()(
  persist(
    (set, get) => ({
      // ─── Initial state ────────────────────────────────────────────────────
      chatOpen: true,
      computerOpen: false,
      tabs: [],
      activeTabId: null,
      sessions: [defaultSession],
      activeSessionId: defaultSession.id,

      // ─── Chat ─────────────────────────────────────────────────────────────
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
      openChat: () => set({ chatOpen: true }),

      // ─── Computer ─────────────────────────────────────────────────────────
      toggleComputer: () => set((s) => ({ computerOpen: !s.computerOpen })),
      openComputer: () => set({ computerOpen: true }),

      openTab: (tab) => {
        const state = get();
        const existing = state.tabs.find(
          (t) =>
            t.type === tab.type &&
            (t.content as { resourceId?: string }).resourceId ===
              (tab.content as { resourceId?: string }).resourceId,
        );
        if (existing) {
          set({ computerOpen: true, activeTabId: existing.id });
          return;
        }
        const newTab: ComputerTab = {
          ...tab,
          id: nanoid(),
          openedAt: new Date().toISOString(),
        };
        set({
          computerOpen: true,
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        });
      },

      closeTab: (tabId) => {
        const state = get();
        const tabs = state.tabs.filter((t) => t.id !== tabId);
        const activeTabId =
          state.activeTabId === tabId
            ? (tabs.at(-1)?.id ?? null)
            : state.activeTabId;
        set({
          tabs,
          activeTabId,
          computerOpen: tabs.length > 0 ? state.computerOpen : false,
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      pinTab: (tabId) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, pinned: !t.pinned } : t,
          ),
        })),

      // ─── Sessions ─────────────────────────────────────────────────────────
      newSession: (projectId?, environmentId?, agentType?) => {
        const session = createSession(projectId, environmentId, agentType);
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.id,
        }));
      },

      selectSession: (sessionId) => set({ activeSessionId: sessionId }),

      deleteSession: (sessionId) => {
        const state = get();
        const sessions = state.sessions.filter((s) => s.id !== sessionId);
        const activeSessionId =
          state.activeSessionId === sessionId
            ? (sessions[0]?.id ?? null)
            : state.activeSessionId;
        set({ sessions, activeSessionId });
      },

      updateSessionTitle: (sessionId, title) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, title } : sess,
          ),
        })),

      addMessage: (sessionId, message) => {
        const msg: ChatMessage = {
          ...message,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const title =
              sess.messages.length === 0 && message.role === "user"
                ? message.content.slice(0, 50)
                : sess.title;
            return {
              ...sess,
              title,
              messages: [...sess.messages, msg],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      // ─── Terminal ─────────────────────────────────────────────────────────
      appendTerminalLines: (tabId, lines) =>
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== tabId || t.type !== "terminal") return t;
            const content = t.content as { type: "terminal"; lines: string[]; title?: string };
            return {
              ...t,
              content: {
                ...content,
                lines: [...content.lines, ...lines],
              },
            };
          }),
        })),

      // ─── Agent ────────────────────────────────────────────────────────────
      launchAgent: (agentType) => {
        const session = createSession(
          undefined,
          undefined,
          agentType as ChatSession["agentType"],
        );
        set((s) => ({
          sessions: [session, ...s.sessions],
          activeSessionId: session.id,
          chatOpen: true,
        }));
      },
    }),
    {
      name: "nimbus:workspace-panel",
      // Only persist sessions and panel toggle state — tabs are ephemeral
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        chatOpen: state.chatOpen,
      }),
    },
  ),
);
