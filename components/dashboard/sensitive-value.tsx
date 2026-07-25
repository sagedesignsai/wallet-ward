"use client"

import { useState } from "react"
import {
  EyeSlashIcon,
  EyeIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SensitiveValueProps = {
  value: string
  className?: string
  mask?: string
}

export function SensitiveValue({
  value,
  className,
  mask = "••••••••••••••••",
}: SensitiveValueProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <code className="flex-1 truncate rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground">
        {revealed ? value : mask}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Hide value" : "Reveal value"}
      >
        {revealed ? (
          <EyeIcon className="size-3.5" />
        ) : (
          <EyeSlashIcon className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
