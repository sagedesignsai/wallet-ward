/**
 * Desktop App Types
 * App manifest and lifecycle types
 */

import type { ComponentType } from "react"
import type { WindowPosition, WindowDimensions } from "./window"
import type { WindowContent } from "./content"

export interface AppManifest {
  /** Unique app identifier (e.g., "code-editor", "terminal") */
  id: string

  /** Display name */
  name: string

  /** Icon name (from Phosphor Icons) or React component */
  icon: string | ComponentType<{ className?: string }>

  /** App version */
  version?: string

  /** Default window dimensions */
  defaultSize: WindowDimensions

  /** Default window position (optional, auto-positioned if not provided) */
  defaultPosition?: WindowPosition

  /** Can windows be resized? */
  resizable?: boolean

  /** Can windows be minimized? */
  minimizable?: boolean

  /** Can windows be maximized? */
  maximizable?: boolean

  /** App kind — "component" renders a React component, "iframe" renders a URL */
  kind?: "component" | "iframe"

  /** React component to render (required for kind "component") */
  component?: ComponentType<AppProps>

  /** URL or URL resolver for iframe apps */
  url?: string | ((content: WindowContent) => string)

  /** iframe sandbox attribute */
  sandbox?: string

  /** iframe allow attribute */
  allow?: string

  /** Signed-URL lifetime in seconds; when set, IframeAppShell shows a sandbox header + countdown */
  expiry?: number

  /** Refresh a signed URL before it expires */
  onRefresh?: (windowId: string) => Promise<{ url: string; token?: string }>

  /** Only one window of this app at a time */
  singleInstance?: boolean

  /** Can windows of this app be closed? (default true) */
  closable?: boolean

  /** Dedupe key — returns a key identifying identical windows of this app */
  dedupeKey?: (content: WindowContent) => string | undefined

  /** Hide from app launcher */
  hidden?: boolean

  /** Required permissions */
  permissions?: string[]

  /** Other apps this app depends on */
  dependencies?: string[]

  /** Keyboard shortcuts */
  shortcuts?: AppShortcut[]

  /** App description */
  description?: string

  /** Category for app launcher */
  category?: string
}

export interface AppShortcut {
  key: string
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[]
  action: string
  description?: string
}

export interface AppProps {
  /** Window ID running this app instance */
  windowId: string

  /** App-specific parameters */
  params?: Record<string, unknown>

  /** Window content payload */
  content?: WindowContent

  /** Callback to close the window */
  onClose?: () => void

  /** Callback to minimize the window */
  onMinimize?: () => void

  /** Callback to maximize the window */
  onMaximize?: () => void
}

export interface AppRegistryStore {
  /** Registered apps by ID */
  apps: Map<string, AppManifest>

  /** Register a new app */
  register: (manifest: AppManifest) => void

  /** Unregister an app */
  unregister: (appId: string) => void

  /** Get app manifest by ID */
  get: (appId: string) => AppManifest | undefined

  /** List all registered apps */
  list: () => AppManifest[]

  /** Check if app is registered */
  has: (appId: string) => boolean
}
