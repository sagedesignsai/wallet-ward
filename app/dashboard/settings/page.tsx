"use client"

import { useEffect, useLayoutEffect, useState, useRef } from "react"
import {
  UserIcon,
  ShieldCheckIcon,
  KeyIcon,
} from "@phosphor-icons/react"
import { useSession } from "@/lib/auth-client"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileForm } from "@/components/settings/profile-form"
import { PasswordForm } from "@/components/settings/password-form"
import { TwoFactorSetup } from "@/components/settings/two-factor-setup"
import { SessionsList } from "@/components/settings/sessions-list"
import { ApiKeysTable } from "@/components/settings/api-keys-table"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheckIcon },
  { id: "api-keys", label: "API Keys", icon: KeyIcon },
] as const

type TabId = (typeof TABS)[number]["id"]

/* ------------------------------------------------------------------ */
/*  SegmentedControl — pill-shaped tab bar with a sliding indicator    */
/* ------------------------------------------------------------------ */

function SegmentedControl({
  value,
  onChange,
}: {
  value: TabId
  onChange: (id: TabId) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  // Measure the active button and position the sliding indicator
  useLayoutEffect(() => {
    const container = containerRef.current
    const active = container?.querySelector<HTMLElement>(
      `[data-tab="${value}"]`
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
      className="relative flex items-center rounded-lg bg-muted p-0.5"
    >
      {/* Sliding background pill */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm transition-all duration-200 ease-out"
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
        }}
      />

      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = value === tab.id
        return (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { setConfig } = useDashboardConfig()
  const { data: sessionData, isPending } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>("profile")

  useEffect(() => {
    setConfig({
      description: "Manage your account and preferences",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
      ],
    })
  }, [setConfig])

  const user = sessionData?.user
  const session = sessionData?.session
  const twoFactorEnabled = user?.twoFactorEnabled ?? false

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <SegmentedControl value={activeTab} onChange={setActiveTab} />

      <div className="min-w-0">
        {activeTab === "profile" && <ProfileForm />}

        {activeTab === "security" && (
          <div className="flex flex-col gap-4">
            <PasswordForm />
            <TwoFactorSetup initialEnabled={twoFactorEnabled} />
            <SessionsList currentSessionId={session?.id ?? ""} />
          </div>
        )}

        {activeTab === "api-keys" && <ApiKeysTable />}
      </div>
    </div>
  )
}
