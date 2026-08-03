/**
 * System Apps Registration
 * Registers all built-in desktop apps
 */

import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { CodeEditorApp } from "@/components/apps/code-editor"
import { DocumentEditorApp } from "@/components/apps/document-editor"
import { ImageViewerApp } from "@/components/apps/image-viewer"
import { FileManagerApp } from "@/components/apps/file-manager"
import { TerminalApp } from "@/components/apps/terminal"
import { CodeIcon, FileTextIcon, ImageIcon, FolderIcon, TerminalIcon } from "@phosphor-icons/react"

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
    component: TerminalApp,
    permissions: ["terminal:execute"],
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
} as const
