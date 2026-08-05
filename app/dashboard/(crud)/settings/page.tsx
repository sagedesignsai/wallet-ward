"use client"

import { useState } from "react"
import { UserIcon, ShieldCheckIcon, KeyIcon } from "@phosphor-icons/react"
import { useSession } from "@/lib/auth-client"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { Skeleton } from "@/components/ui/skeleton"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ProfileForm } from "@/components/settings/profile-form"
import { PasswordForm } from "@/components/settings/password-form"
import { TwoFactorSetup } from "@/components/settings/two-factor-setup"
import { SessionsList } from "@/components/settings/sessions-list"
import { ApiKeysTable } from "@/components/settings/api-keys-table"

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheckIcon },
  { id: "api-keys", label: "API Keys", icon: KeyIcon },
] as const

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { data: sessionData, isPending } = useSession()
  const [activeTab, setActiveTab] = useState<string>("profile")

  useDashboardConfigStore.setState({
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings" },
    ],
  })

  const user = sessionData?.user
  const session = sessionData?.session
  const twoFactorEnabled = user?.twoFactorEnabled ?? false

  if (isPending) {
    return (
      <div className="flex animate-in flex-col gap-4 duration-300 fade-in">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-6 duration-300 fade-in">
      <SegmentedControl tabs={TABS} value={activeTab} onChange={setActiveTab} />

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
