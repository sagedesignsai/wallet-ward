"use client"

import { useEffect, useState } from "react"
import { registerSystemApps } from "@/lib/desktop/system-apps"

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Register system apps once on mount
    registerSystemApps()
    setInitialized(true)
  }, [])

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">Initializing desktop...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
