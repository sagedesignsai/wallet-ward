"use client"

import { useDesktopState } from "@/stores/desktop/desktop-state.store"
import { cn } from "@/lib/utils"
import type { ContextMenuItem } from "@/stores/desktop/desktop-state.store"

export interface DesktopContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
}

export function DesktopContextMenu({ x, y, items }: DesktopContextMenuProps) {
  const closeContextMenu = useDesktopState((s) => s.closeContextMenu)

  return (
    <div
      className="fixed z-[10000] min-w-[180px] rounded-md border border-border bg-background/95 backdrop-blur-sm shadow-lg py-1"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.submenu) {
          return (
            <div key={item.id} className="relative group">
              <button
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs",
                  "hover:bg-muted",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                  {item.label}
                </span>
                <span className="text-muted-foreground">▶</span>
              </button>

              {/* Submenu */}
              <div className="hidden group-hover:block absolute left-full top-0">
                <div className="ml-1 min-w-[150px] rounded-md border border-border bg-background/95 backdrop-blur-sm shadow-lg py-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      disabled={subItem.disabled}
                      onClick={() => {
                        subItem.onClick?.()
                        closeContextMenu()
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-xs",
                        "hover:bg-muted",
                        subItem.disabled && "opacity-50 cursor-not-allowed",
                        subItem.danger && "text-destructive hover:bg-destructive/10"
                      )}
                    >
                      {subItem.icon && <span className="text-xs">{subItem.icon}</span>}
                      {subItem.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        return (
          <button
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              item.onClick?.()
              closeContextMenu()
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs",
              "hover:bg-muted",
              item.disabled && "opacity-50 cursor-not-allowed",
              item.danger && "text-destructive hover:bg-destructive/10"
            )}
          >
            <span className="flex items-center gap-2">
              {item.icon && <span className="text-xs">{item.icon}</span>}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-muted-foreground text-[10px]">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
