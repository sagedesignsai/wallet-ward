import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import type { WindowContent } from "@/types/desktop/content"
import type { ComputerTab } from "@/stores/workspace-panel-store"

const TAB_TO_APP: Record<ComputerTab["type"], string> = {
  code: "code-editor",
  document: "document-editor",
  artifact: "artifact",
  preview: "preview",
  terminal: "terminal",
  secret: "secret",
  task: "task",
  image: "image-viewer",
  "file-tree": "file-manager",
  desktop: "desktop",
  "web-terminal": "web-terminal",
}

export function openInWindow(tab: Omit<ComputerTab, "id" | "openedAt">): string {
  const appId = TAB_TO_APP[tab.type]
  const app = useAppRegistry.getState().get(appId)
  return useWindowManager.getState().openWindow({
    appId,
    title: tab.title,
    content: tab.content as WindowContent,
    pinned: tab.pinned,
    closable: tab.pinned ? false : undefined,
    width: app?.defaultSize.width ?? 800,
    height: app?.defaultSize.height ?? 600,
    resizable: app?.resizable ?? true,
    minimizable: app?.minimizable ?? true,
    maximizable: app?.maximizable ?? true,
    state: "normal",
  })
}
