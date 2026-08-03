/**
 * App Registry Store
 * Manages registration and lookup of desktop apps
 */

import { create } from "zustand"
import type { AppManifest, AppRegistryStore } from "@/types/desktop/app"

export const useAppRegistry = create<AppRegistryStore>((set, get) => ({
  apps: new Map<string, AppManifest>(),

  register: (manifest) => {
    set((s) => {
      const apps = new Map(s.apps)
      apps.set(manifest.id, manifest)
      return { apps }
    })
  },

  unregister: (appId) => {
    set((s) => {
      const apps = new Map(s.apps)
      apps.delete(appId)
      return { apps }
    })
  },

  get: (appId) => {
    return get().apps.get(appId)
  },

  list: () => {
    return Array.from(get().apps.values())
  },

  has: (appId) => {
    return get().apps.has(appId)
  },
}))

/**
 * App Registry Service
 * Helper methods for app management
 */
export class AppRegistryService {
  static registerBatch(manifests: AppManifest[]) {
    const { register } = useAppRegistry.getState()
    manifests.forEach(register)
  }

  static getAppsByCategory(category: string) {
    const { list } = useAppRegistry.getState()
    return list().filter((app) => app.category === category)
  }

  static getAppsByPermission(permission: string) {
    const { list } = useAppRegistry.getState()
    return list().filter((app) => app.permissions?.includes(permission))
  }

  static validateDependencies(appId: string) {
    const { get, has } = useAppRegistry.getState()
    const app = get(appId)
    if (!app?.dependencies) return true

    return app.dependencies.every((depId) => has(depId))
  }

  static getAppInfo(appId: string) {
    const { get } = useAppRegistry.getState()
    const app = get(appId)
    if (!app) return null

    return {
      id: app.id,
      name: app.name,
      description: app.description,
      category: app.category,
      version: app.version,
    }
  }
}
