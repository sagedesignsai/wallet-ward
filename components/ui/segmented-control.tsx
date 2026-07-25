"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import type { ComponentType } from "react"

import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabItem = {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** When provided the tab renders as a Next.js Link instead of a button. */
  href?: string
}

interface SegmentedControlProps {
  tabs: readonly TabItem[] | TabItem[]
  /** The currently active tab id. */
  value: string
  /** Called when a button-tab is clicked. Not called for link-tabs. */
  onChange?: (id: string) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/*  SegmentedControl                                                   */
/* ------------------------------------------------------------------ */

export function SegmentedControl({
  tabs,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  // Measure the active tab element and position the sliding indicator.
  useLayoutEffect(() => {
    const container = containerRef.current
    const active = container?.querySelector<HTMLElement>(
      `[data-seg="${value}"]`
    )
    if (!container || !active) return

    const cr = container.getBoundingClientRect()
    const ar = active.getBoundingClientRect()
    setIndicator({
      left: ar.left - cr.left,
      width: ar.width,
    })
  }, [value])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center rounded-lg bg-muted p-0.5",
        className
      )}
    >
      {/* Sliding background pill */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm transition-all duration-200 ease-out"
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
        }}
      />

      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = value === tab.id
        const sharedClassName = cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground/70"
        )

        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-seg={tab.id}
              className={sharedClassName}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </Link>
          )
        }

        return (
          <button
            key={tab.id}
            data-seg={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={sharedClassName}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
