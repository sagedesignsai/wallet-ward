"use client"

import { useEffect } from "react"
import {
  UserIcon,
  ShieldCheckIcon,
  KeyIcon,
} from "@phosphor-icons/react"
import { useSession } from "@/lib/auth-client"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileForm } from "@/components/settings/profile-form"
import { PasswordForm } from "@/components/settings/password-form"
import { TwoFactorSetup } from "@/components/settings/two-factor-setup"
import { SessionsList } from "@/components/settings/sessions-list"
import { ApiKeysTable } from "@/components/settings/api-keys-table"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { setConfig } = useDashboardConfig()
  const { data: sessionData, isPending } = useSession()
  const isMobile = useIsMobile()

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
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <Tabs
        defaultValue="profile"
        orientation={isMobile ? "horizontal" : "vertical"}
        className={cn(
          "gap-4",
          !isMobile && "flex-row"
        )}
      >
        <TabsList
          variant="line"
          className={cn(
            isMobile
              ? "w-full overflow-x-auto"
              : "w-44 shrink-0 self-start"
          )}
        >
          <TabsTrigger value="profile" className="gap-1.5">
            <UserIcon className="size-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <ShieldCheckIcon className="size-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-1.5">
            <KeyIcon className="size-3.5" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="profile" className="mt-0">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="security" className="mt-0 flex flex-col gap-4">
            <PasswordForm />
            <TwoFactorSetup initialEnabled={twoFactorEnabled} />
            <SessionsList currentSessionId={session?.id ?? ""} />
          </TabsContent>

          <TabsContent value="api-keys" className="mt-0">
            <ApiKeysTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
