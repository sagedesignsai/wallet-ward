/**
 * App Lifecycle Service
 * Manages app mount/unmount/serialize hooks
 */

import type { AppManifest } from "@/types/desktop/app"

export interface AppLifecycleHooks {
  /** Called when app mounts in a window */
  onMount?: (windowId: string, params?: Record<string, unknown>) => void | Promise<void>

  /** Called when app unmounts (window closed) */
  onUnmount?: (windowId: string) => void | Promise<void>

  /** Called to serialize app state for persistence */
  onSerialize?: (windowId: string) => Record<string, unknown> | Promise<Record<string, unknown>>

  /** Called to restore app state from serialization */
  onDeserialize?: (windowId: string, state: Record<string, unknown>) => void | Promise<void>

  /** Called when window gains focus */
  onFocus?: (windowId: string) => void

  /** Called when window loses focus */
  onBlur?: (windowId: string) => void
}

interface AppLifecycleRegistry {
  hooks: Map<string, AppLifecycleHooks>
  serializedStates: Map<string, Record<string, unknown>>
}

class AppLifecycleManager {
  private registry: AppLifecycleRegistry = {
    hooks: new Map(),
    serializedStates: new Map(),
  }

  /**
   * Register lifecycle hooks for an app
   */
  registerHooks(appId: string, hooks: AppLifecycleHooks) {
    this.registry.hooks.set(appId, hooks)
  }

  /**
   * Unregister lifecycle hooks
   */
  unregisterHooks(appId: string) {
    this.registry.hooks.delete(appId)
  }

  /**
   * Get hooks for an app
   */
  getHooks(appId: string): AppLifecycleHooks | undefined {
    return this.registry.hooks.get(appId)
  }

  /**
   * Trigger mount hook
   */
  async mount(windowId: string, appId: string, params?: Record<string, unknown>) {
    const hooks = this.getHooks(appId)
    if (hooks?.onMount) {
      await hooks.onMount(windowId, params)
    }
  }

  /**
   * Trigger unmount hook
   */
  async unmount(windowId: string, appId: string) {
    const hooks = this.getHooks(appId)
    if (hooks?.onUnmount) {
      await hooks.onUnmount(windowId)
    }
  }

  /**
   * Serialize app state
   */
  async serialize(windowId: string, appId: string): Promise<Record<string, unknown> | null> {
    const hooks = this.getHooks(appId)
    if (hooks?.onSerialize) {
      const state = await hooks.onSerialize(windowId)
      this.registry.serializedStates.set(windowId, state)
      return state
    }
    return null
  }

  /**
   * Deserialize app state
   */
  async deserialize(windowId: string, appId: string, state: Record<string, unknown>) {
    const hooks = this.getHooks(appId)
    if (hooks?.onDeserialize) {
      await hooks.onDeserialize(windowId, state)
    }
  }

  /**
   * Get serialized state for a window
   */
  getSerializedState(windowId: string): Record<string, unknown> | undefined {
    return this.registry.serializedStates.get(windowId)
  }

  /**
   * Clear serialized state for a window
   */
  clearSerializedState(windowId: string) {
    this.registry.serializedStates.delete(windowId)
  }

  /**
   * Trigger focus hook
   */
  focus(windowId: string, appId: string) {
    const hooks = this.getHooks(appId)
    if (hooks?.onFocus) {
      hooks.onFocus(windowId)
    }
  }

  /**
   * Trigger blur hook
   */
  blur(windowId: string, appId: string) {
    const hooks = this.getHooks(appId)
    if (hooks?.onBlur) {
      hooks.onBlur(windowId)
    }
  }
}

export const appLifecycle = new AppLifecycleManager()

/**
 * React hook for app lifecycle management
 */
export function useAppLifecycle(appId: string, hooks: AppLifecycleHooks, deps: any[] = []) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect } = require("react")

    useEffect(() => {
      appLifecycle.registerHooks(appId, hooks)
      return () => {
        appLifecycle.unregisterHooks(appId)
      }
    }, [appId, ...deps])
  }
}
