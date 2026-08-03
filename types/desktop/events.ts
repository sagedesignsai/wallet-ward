/**
 * Desktop Event Types
 * Inter-app communication message types
 */

export type AppEventType =
  | "file:open"
  | "file:save"
  | "file:delete"
  | "terminal:execute"
  | "app:launch"
  | "app:close"
  | "window:focus"
  | "window:move"
  | "window:resize"
  | "clipboard:copy"
  | "clipboard:paste"
  | "notification:show"
  | "settings:change"

export interface AppMessage {
  /** Source app ID */
  from: string

  /** Target app ID or "*" for broadcast */
  to: string | "*"

  /** Event type */
  type: AppEventType | string

  /** Event payload */
  payload: unknown

  /** Timestamp */
  timestamp: number

  /** Optional correlation ID for request/response patterns */
  correlationId?: string
}

export interface FileOpenPayload {
  path: string
  content?: string
  language?: string
  readOnly?: boolean
}

export interface FileSavePayload {
  path: string
  content: string
}

export interface TerminalExecutePayload {
  command: string
  cwd?: string
}

export interface AppLaunchPayload {
  appId: string
  params?: Record<string, unknown>
  content?: Record<string, unknown>
}

export interface NotificationShowPayload {
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
}

export type MessageHandler = (message: AppMessage) => void

export interface MessageBus {
  /** Send a message */
  send: (message: Omit<AppMessage, "timestamp">) => void

  /** Subscribe to messages of a specific type */
  subscribe: (type: string, handler: MessageHandler) => () => void

  /** Subscribe to all messages */
  subscribeAll: (handler: MessageHandler) => () => void

  /** Unsubscribe all handlers for a type */
  clear: (type?: string) => void
}
