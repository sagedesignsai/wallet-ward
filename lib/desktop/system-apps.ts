/**
 * System Apps Registration
 * Registers all built-in desktop apps
 */

import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { CodeEditorApp } from "@/components/apps/code-editor"
import { DocumentEditorApp } from "@/components/apps/document-editor"
import { ImageViewerApp } from "@/components/apps/image-viewer"
import { FileManagerApp } from "@/components/apps/file-manager"
import { TerminalApp } from "@/components/apps/terminal"
import { ArtifactApp } from "@/components/apps/artifact"
import { TaskApp } from "@/components/apps/task"
import { SecretApp } from "@/components/apps/secret"
import { CodingAgentApp } from "@/components/apps/coding-agent"
import {
  CodeIcon,
  FileTextIcon,
  ImageIcon,
  FolderIcon,
  TerminalIcon,
  ListChecksIcon,
  KeyIcon,
  GlobeIcon,
  DesktopIcon,
  TerminalWindowIcon,
  CpuIcon,
} from "@phosphor-icons/react"
import type {
  PreviewContent,
  DesktopContent,
  WebTerminalContent,
  OpencodeWorkspaceContent,
} from "@/types/desktop/content"

/**
 * Register all system apps
 * Call this once when the desktop initializes
 */
export function registerSystemApps() {
  const { register } = useAppRegistry.getState()

  // Code Editor
  register({
    id: "code-editor",
    name: "Code Editor",
    icon: CodeIcon,
    description: "View and edit code files",
    category: "Development",
    defaultSize: { width: 800, height: 600 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    component: CodeEditorApp,
    permissions: ["fs:read"],
  })

  // Document Editor
  register({
    id: "document-editor",
    name: "Document Editor",
    icon: FileTextIcon,
    description: "Create and edit documents",
    category: "Productivity",
    defaultSize: { width: 700, height: 500 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    component: DocumentEditorApp,
    permissions: ["fs:read", "fs:write"],
  })

  // Image Viewer
  register({
    id: "image-viewer",
    name: "Image Viewer",
    icon: ImageIcon,
    description: "View images",
    category: "Media",
    defaultSize: { width: 600, height: 500 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    component: ImageViewerApp,
  })

  // File Manager
  register({
    id: "file-manager",
    name: "File Manager",
    icon: FolderIcon,
    description: "Browse and manage files",
    category: "System",
    defaultSize: { width: 700, height: 500 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    component: FileManagerApp,
    permissions: ["fs:read", "fs:write"],
  })

  // Terminal
  register({
    id: "terminal",
    name: "Terminal",
    icon: TerminalIcon,
    description: "Execute commands in a terminal",
    category: "Development",
    defaultSize: { width: 700, height: 450 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: false,
    component: TerminalApp,
    permissions: ["terminal:execute"],
  })

  // Artifact
  register({
    id: "artifact",
    name: "Artifact",
    icon: CodeIcon,
    kind: "component",
    component: ArtifactApp,
    hidden: true,
    category: "Development",
    defaultSize: { width: 700, height: 500 },
    resizable: true,
    minimizable: true,
    maximizable: true,
  })

  // Task
  register({
    id: "task",
    name: "Task",
    icon: ListChecksIcon,
    kind: "component",
    component: TaskApp,
    hidden: true,
    category: "Productivity",
    defaultSize: { width: 600, height: 450 },
    resizable: true,
    minimizable: true,
    maximizable: true,
  })

  // Secret
  register({
    id: "secret",
    name: "Secret",
    icon: KeyIcon,
    kind: "component",
    component: SecretApp,
    hidden: true,
    category: "System",
    defaultSize: { width: 600, height: 400 },
    resizable: true,
    minimizable: true,
    maximizable: true,
  })

  // Preview
  register({
    id: "preview",
    name: "Preview",
    icon: GlobeIcon,
    kind: "iframe",
    hidden: true,
    url: (c) => (c as PreviewContent).url,
    sandbox: "allow-scripts allow-same-origin allow-popups",
    allow: "clipboard-read; clipboard-write",
    category: "Web",
    defaultSize: { width: 900, height: 600 },
    onRefresh: async (windowId) => {
      const win = useWindowManager.getState().getWindow(windowId)
      const content = win?.content as PreviewContent & {
        sandboxId?: string
        port?: number
      }
      const sandboxId = content?.sandboxId
      if (!sandboxId) throw new Error("Missing sandbox id")
      const res = await fetch(`/api/agents/sandboxes/${sandboxId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", port: content?.port }),
      })
      const payload = await res.json()
      if (!res.ok)
        throw new Error(payload?.error?.message ?? "Failed to refresh preview URL")
      return payload.data as { url: string; token?: string }
    },
  })

  // Desktop (VNC)
  register({
    id: "desktop",
    name: "Desktop",
    icon: DesktopIcon,
    kind: "iframe",
    hidden: true,
    url: (c) => (c as DesktopContent).url,
    sandbox: "allow-scripts allow-same-origin",
    allow: "clipboard-read; clipboard-write",
    expiry: 3600,
    singleInstance: true,
    dedupeKey: (c) => (c as DesktopContent).sandboxId,
    category: "System",
    defaultSize: { width: 960, height: 640 },
    onRefresh: async (windowId) => {
      const win = useWindowManager.getState().getWindow(windowId)
      const sandboxId = (win?.content as DesktopContent).sandboxId
      if (!sandboxId) throw new Error("Missing sandbox id")
      const res = await fetch(`/api/agents/sandboxes/${sandboxId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "desktop" }),
      })
      const payload = await res.json()
      if (!res.ok)
        throw new Error(payload?.error?.message ?? "Failed to refresh desktop URL")
      return payload.data as { url: string; token?: string }
    },
  })

  // Web Terminal
  register({
    id: "web-terminal",
    name: "Web Terminal",
    icon: TerminalWindowIcon,
    kind: "iframe",
    hidden: true,
    url: (c) => (c as WebTerminalContent).url,
    sandbox: "allow-scripts allow-same-origin",
    allow: "clipboard-read; clipboard-write",
    expiry: 3600,
    singleInstance: true,
    dedupeKey: (c) => (c as WebTerminalContent).sandboxId,
    category: "System",
    defaultSize: { width: 800, height: 500 },
    onRefresh: async (windowId) => {
      const win = useWindowManager.getState().getWindow(windowId)
      const sandboxId = (win?.content as WebTerminalContent).sandboxId
      if (!sandboxId) throw new Error("Missing sandbox id")
      const res = await fetch(`/api/agents/sandboxes/${sandboxId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "web-terminal" }),
      })
      const payload = await res.json()
      if (!res.ok)
        throw new Error(payload?.error?.message ?? "Failed to refresh web terminal URL")
      return payload.data as { url: string; token?: string }
    },
  })

  // Coding Agent Workbench App
  register({
    id: "coding-agent-app",
    name: "Coding Agent",
    icon: CpuIcon,
    description: "Pair programming interface with OpenCode subagent & Daytona cloud sandboxes",
    category: "Agents",
    defaultSize: { width: 1100, height: 750 },
    resizable: true,
    minimizable: true,
    maximizable: true,
    singleInstance: true,
    dedupeKey: (c) => (c as OpencodeWorkspaceContent).sandboxId,
    component: CodingAgentApp,
    permissions: ["fs:read", "fs:write", "terminal:execute", "sandbox:manage"],
  })
}

/**
 * System app IDs for easy reference
 */
export const SYSTEM_APP_IDS = {
  CODE_EDITOR: "code-editor",
  DOCUMENT_EDITOR: "document-editor",
  IMAGE_VIEWER: "image-viewer",
  FILE_MANAGER: "file-manager",
  TERMINAL: "terminal",
  CODING_AGENT: "coding-agent-app",
} as const
