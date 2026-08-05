"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useDashboardConfigStore } from "@/stores/dashboard-config"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useDashboardConfigStore.setState({
    title: "Workspace",
    breadcrumbs: [{ label: "Workspace" }],
  })

  return (
    <>
      <DashboardHeader collapsible />
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </>
  )
}
