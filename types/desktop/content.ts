/**
 * Desktop Window Content Types
 * Single source of truth for window/app content payloads
 */

export interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  language?: string
  children?: FileNode[]
}

export interface CodeContent {
  type: "code"
  code: string
  language: string
  filename?: string
  /** If tied to a DB record */
  resourceId?: string
}

export interface DocumentContent {
  type: "document"
  title: string
  body: string // markdown / rich text
  resourceId?: string
  projectId?: string
  editable?: boolean
}

export interface ArtifactContent {
  type: "artifact"
  title: string
  description?: string
  code?: string
  language?: string
  /** Rendered HTML string for preview */
  html?: string
}

export interface PreviewContent {
  type: "preview"
  url: string
  title?: string
  /** Sandbox id used to re-resolve the signed URL after reload */
  sandboxId?: string
  /** Port to preview (defaults to 3000 server-side) */
  port?: number
}

export interface TerminalContent {
  type: "terminal"
  lines: string[]
  title?: string
}

export interface SecretContent {
  type: "secret"
  name: string
  secretType: string
  resourceId: string
  projectId: string
  environmentId: string
}

export interface TaskContent {
  type: "task"
  title: string
  description?: string
  status: string
  resourceId: string
  projectId: string
}

export interface ImageContent {
  type: "image"
  url: string
  alt?: string
}

export interface FileTreeContent {
  type: "file-tree"
  title: string
  /** Recursive tree structure */
  tree: FileNode[]
  /** Initially selected path */
  selectedPath?: string
}

export interface DesktopContent {
  type: "desktop"
  url: string // Signed preview URL for port 6080 (noVNC)
  token: string // For refresh/revocation
  sandboxId: string
  sandboxName: string
}

export interface WebTerminalContent {
  type: "web-terminal"
  url: string // Signed preview URL for port 22222
  token: string
  sandboxId: string
  sandboxName: string
}

export interface OpencodeWorkspaceContent {
  type: "opencode-workspace"
  /** Signed preview URL of the OpenCode server (port 4096) inside the sandbox. */
  url: string
  token: string
  sandboxId: string
  /** Project the session belongs to (dispatch mode when absent). */
  projectId?: string
  /** OpenCode conversation session id (auto-created when absent). */
  sessionId?: string
  title?: string
}

export type WindowContent =
  | CodeContent
  | DocumentContent
  | ArtifactContent
  | PreviewContent
  | TerminalContent
  | SecretContent
  | TaskContent
  | ImageContent
  | FileTreeContent
  | DesktopContent
  | WebTerminalContent
  | OpencodeWorkspaceContent

/** Back-compat alias for the Computer panel content union */
export type ComputerContent = WindowContent

export type WindowContentType = WindowContent["type"]