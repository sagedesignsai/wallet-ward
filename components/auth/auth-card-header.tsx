"use client"

import React from "react"
import { ShieldCheckIcon, LockKeyIcon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"

interface AuthCardHeaderProps {
  title: string
  description?: string
  badgeText?: string
  icon?: "shield" | "lock"
}

export function AuthCardHeader({
  title,
  description,
  badgeText,
  icon = "shield",
}: AuthCardHeaderProps) {
  const IconComponent = icon === "shield" ? ShieldCheckIcon : LockKeyIcon

  return (
    <div className="flex flex-col items-center space-y-3 text-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
        <IconComponent
          className="h-6 w-6 animate-pulse text-primary"
          weight="duotone"
        />
      </div>

      {badgeText && (
        <Badge
          variant="outline"
          className="rounded-full border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {badgeText}
        </Badge>
      )}

      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
