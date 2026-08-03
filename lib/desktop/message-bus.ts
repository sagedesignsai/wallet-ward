/**
 * Desktop Message Bus
 * Inter-app communication via publish/subscribe pattern
 */

import { create } from "zustand"
import type { AppMessage, MessageHandler } from "@/types/desktop/events"

interface MessageBusStore {
  handlers: Map<string, Set<MessageHandler>>
  globalHandlers: Set<MessageHandler>

  subscribe: (type: string, handler: MessageHandler) => () => void
  subscribeAll: (handler: MessageHandler) => () => void
  send: (message: Omit<AppMessage, "timestamp">) => void
  clear: (type?: string) => void
}

export const messageBus = create<MessageBusStore>((set, get) => ({
  handlers: new Map(),
  globalHandlers: new Set(),

  subscribe: (type, handler) => {
    const { handlers } = get()
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }
    handlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      handlers.get(type)?.delete(handler)
      if (handlers.get(type)?.size === 0) {
        handlers.delete(type)
      }
    }
  },

  subscribeAll: (handler) => {
    const { globalHandlers } = get()
    globalHandlers.add(handler)

    // Return unsubscribe function
    return () => {
      globalHandlers.delete(handler)
    }
  },

  send: (message) => {
    const { handlers, globalHandlers } = get()
    const fullMessage: AppMessage = {
      ...message,
      timestamp: Date.now(),
    }

    // Notify type-specific handlers
    const typeHandlers = handlers.get(fullMessage.type)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => handler(fullMessage))
    }

    // Notify global handlers
    globalHandlers.forEach((handler) => handler(fullMessage))
  },

  clear: (type) => {
    if (type) {
      get().handlers.delete(type)
    } else {
      set({ handlers: new Map(), globalHandlers: new Set() })
    }
  },
}))

/**
 * React hook for message bus
 */
export function useMessageBus() {
  const subscribe = messageBus((s) => s.subscribe)
  const subscribeAll = messageBus((s) => s.subscribeAll)
  const send = messageBus((s) => s.send)

  return { subscribe, subscribeAll, send }
}

/**
 * React hook to subscribe to specific message types
 */
export function useSubscribe(type: string, handler: MessageHandler, deps: any[] = []) {
  const subscribe = messageBus((s) => s.subscribe)

  // Use useEffect to subscribe/unsubscribe
  if (typeof window !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect } = require("react")
    useEffect(() => {
      const unsubscribe = subscribe(type, handler)
      return unsubscribe
    }, [type, subscribe, ...deps])
  }
}
