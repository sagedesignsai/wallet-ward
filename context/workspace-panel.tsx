"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { nanoid } from "nanoid";

// ─── Content types the Computer panel can display ────────────────────────────

export type ComputerTabType =
  | "code"       // syntax-highlighted code file
  | "document"   // rich text document
  | "artifact"   // AI-generated artifact (JSX, HTML, JSON…)
  | "preview"    // live web preview / iframe
  | "terminal"   // terminal output / log
  | "secret"     // secret value viewer
  | "task"       // task detail
  | "image"      // image viewer
  | "file-tree"; // file browser

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
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface WorkspacePanelState {
  /** Whether the AI chat panel is visible */
  chatOpen: boolean;
  /** Whether the Computer panel is visible */
  computerOpen: boolean;
  /** All open tabs in Computer panel */
  tabs: ComputerTab[];
  /** Active tab id */
  activeTabId: string | null;
  /** All persisted chat sessions */
  sessions: ChatSession[];
  /** Active session id */
  activeSessionId: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "TOGGLE_CHAT" }
  | { type: "TOGGLE_COMPUTER" }
  | { type: "OPEN_CHAT" }
  | { type: "OPEN_COMPUTER" }
  | { type: "OPEN_TAB"; tab: Omit<ComputerTab, "id" | "openedAt"> }
  | { type: "CLOSE_TAB"; tabId: string }
  | { type: "SET_ACTIVE_TAB"; tabId: string }
  | { type: "PIN_TAB"; tabId: string }
  | { type: "NEW_SESSION"; projectId?: string; environmentId?: string }
  | { type: "SELECT_SESSION"; sessionId: string }
  | { type: "DELETE_SESSION"; sessionId: string }
  | { type: "UPDATE_SESSION_TITLE"; sessionId: string; title: string }
  | { type: "ADD_MESSAGE"; sessionId: string; message: Omit<ChatMessage, "id" | "createdAt"> }
  | { type: "HYDRATE"; state: WorkspacePanelState };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function createSession(
  projectId?: string,
  environmentId?: string
): ChatSession {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    title: "New conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
    projectId,
    environmentId,
  };
}

function reducer(
  state: WorkspacePanelState,
  action: Action
): WorkspacePanelState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "TOGGLE_CHAT":
      return { ...state, chatOpen: !state.chatOpen };

    case "TOGGLE_COMPUTER":
      return { ...state, computerOpen: !state.computerOpen };

    case "OPEN_CHAT":
      return { ...state, chatOpen: true };

    case "OPEN_COMPUTER":
      return { ...state, computerOpen: true };

    case "OPEN_TAB": {
      const existing = state.tabs.find(
        (t) =>
          t.type === action.tab.type &&
          (t.content as { resourceId?: string }).resourceId ===
            (action.tab.content as { resourceId?: string }).resourceId
      );
      if (existing) {
        return {
          ...state,
          computerOpen: true,
          activeTabId: existing.id,
        };
      }
      const newTab: ComputerTab = {
        ...action.tab,
        id: nanoid(),
        openedAt: new Date().toISOString(),
      };
      return {
        ...state,
        computerOpen: true,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }

    case "CLOSE_TAB": {
      const tabs = state.tabs.filter((t) => t.id !== action.tabId);
      const activeTabId =
        state.activeTabId === action.tabId
          ? (tabs.at(-1)?.id ?? null)
          : state.activeTabId;
      return {
        ...state,
        tabs,
        activeTabId,
        computerOpen: tabs.length > 0 ? state.computerOpen : false,
      };
    }

    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.tabId };

    case "PIN_TAB":
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.tabId ? { ...t, pinned: !t.pinned } : t
        ),
      };

    case "NEW_SESSION": {
      const session = createSession(action.projectId, action.environmentId);
      return {
        ...state,
        sessions: [session, ...state.sessions],
        activeSessionId: session.id,
      };
    }

    case "SELECT_SESSION":
      return { ...state, activeSessionId: action.sessionId };

    case "DELETE_SESSION": {
      const sessions = state.sessions.filter((s) => s.id !== action.sessionId);
      const activeSessionId =
        state.activeSessionId === action.sessionId
          ? (sessions[0]?.id ?? null)
          : state.activeSessionId;
      return { ...state, sessions, activeSessionId };
    }

    case "UPDATE_SESSION_TITLE":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId ? { ...s, title: action.title } : s
        ),
      };

    case "ADD_MESSAGE": {
      const msg: ChatMessage = {
        ...action.message,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.id !== action.sessionId) return s;
          const title =
            s.messages.length === 0 && action.message.role === "user"
              ? action.message.content.slice(0, 50)
              : s.title;
          return {
            ...s,
            title,
            messages: [...s.messages, msg],
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    default:
      return state;
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

const STORAGE_KEY = "nimbus:workspace-panel";

const defaultSession = createSession();

const initialState: WorkspacePanelState = {
  chatOpen: true,
  computerOpen: false,
  tabs: [],
  activeTabId: null,
  sessions: [defaultSession],
  activeSessionId: defaultSession.id,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface WorkspacePanelContextValue {
  state: WorkspacePanelState;
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
  newSession: (projectId?: string, environmentId?: string) => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "createdAt">) => void;
  // Convenience
  activeSession: ChatSession | null;
  activeTab: ComputerTab | null;
}

const WorkspacePanelContext = createContext<WorkspacePanelContextValue | null>(
  null
);

export function WorkspacePanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as WorkspacePanelState;
        // Don't restore open tabs — those are session-specific UI
        dispatch({
          type: "HYDRATE",
          state: {
            ...saved,
            tabs: [],
            activeTabId: null,
            computerOpen: false,
          },
        });
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const toggleChat = useCallback(() => dispatch({ type: "TOGGLE_CHAT" }), []);
  const openChat = useCallback(() => dispatch({ type: "OPEN_CHAT" }), []);
  const toggleComputer = useCallback(
    () => dispatch({ type: "TOGGLE_COMPUTER" }),
    []
  );
  const openComputer = useCallback(
    () => dispatch({ type: "OPEN_COMPUTER" }),
    []
  );
  const openTab = useCallback(
    (tab: Omit<ComputerTab, "id" | "openedAt">) =>
      dispatch({ type: "OPEN_TAB", tab }),
    []
  );
  const closeTab = useCallback(
    (tabId: string) => dispatch({ type: "CLOSE_TAB", tabId }),
    []
  );
  const setActiveTab = useCallback(
    (tabId: string) => dispatch({ type: "SET_ACTIVE_TAB", tabId }),
    []
  );
  const pinTab = useCallback(
    (tabId: string) => dispatch({ type: "PIN_TAB", tabId }),
    []
  );
  const newSession = useCallback(
    (projectId?: string, environmentId?: string) =>
      dispatch({ type: "NEW_SESSION", projectId, environmentId }),
    []
  );
  const selectSession = useCallback(
    (sessionId: string) => dispatch({ type: "SELECT_SESSION", sessionId }),
    []
  );
  const deleteSession = useCallback(
    (sessionId: string) => dispatch({ type: "DELETE_SESSION", sessionId }),
    []
  );
  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) =>
      dispatch({ type: "UPDATE_SESSION_TITLE", sessionId, title }),
    []
  );
  const addMessage = useCallback(
    (
      sessionId: string,
      message: Omit<ChatMessage, "id" | "createdAt">
    ) => dispatch({ type: "ADD_MESSAGE", sessionId, message }),
    []
  );

  const activeSession =
    state.sessions.find((s) => s.id === state.activeSessionId) ?? null;
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? null;

  const value = useMemo<WorkspacePanelContextValue>(
    () => ({
      state,
      toggleChat,
      openChat,
      toggleComputer,
      openComputer,
      openTab,
      closeTab,
      setActiveTab,
      pinTab,
      newSession,
      selectSession,
      deleteSession,
      updateSessionTitle,
      addMessage,
      activeSession,
      activeTab,
    }),
    [
      state,
      toggleChat,
      openChat,
      toggleComputer,
      openComputer,
      openTab,
      closeTab,
      setActiveTab,
      pinTab,
      newSession,
      selectSession,
      deleteSession,
      updateSessionTitle,
      addMessage,
      activeSession,
      activeTab,
    ]
  );

  return (
    <WorkspacePanelContext.Provider value={value}>
      {children}
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel() {
  const ctx = useContext(WorkspacePanelContext);
  if (!ctx) {
    throw new Error(
      "useWorkspacePanel must be used within <WorkspacePanelProvider>"
    );
  }
  return ctx;
}
