"use client"

import { useEffect } from "react"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"

export default function DashboardPage() {
  const { setConfig } = useDashboardConfig()

  useEffect(() => {
    setConfig({
      title: "Dashboard",
      description: "Overview of your secrets vault",
      breadcrumbs: [{ label: "Dashboard" }],
    })
  }, [setConfig])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Projects", value: "—" },
          { label: "Secrets", value: "—" },
          { label: "Environments", value: "—" },
          { label: "Team Members", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/60 bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Project overview coming soon.
        </p>
      </div>
    </div>
  )
}
