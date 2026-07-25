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
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
        <IconComponent className="w-6 h-6 text-primary animate-pulse" weight="duotone" />
      </div>
      
      {badgeText && (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full border-primary/30 text-primary bg-primary/5">
          {badgeText}
        </Badge>
      )}

      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
