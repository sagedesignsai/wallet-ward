"use client"

import * as React from "react"

type BreadcrumbItem = {
  label: string
  href?: string
}

type DashboardConfig = {
  title?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  collapsibleHeader?: boolean
}

type DashboardConfigContextValue = {
  config: DashboardConfig
  setConfig: (config: DashboardConfig) => void
}

const DEFAULT_CONFIG: DashboardConfig = {
  title: "Dashboard",
  breadcrumbs: [],
  actions: null,
}

const DashboardConfigContext =
  React.createContext<DashboardConfigContextValue | null>(null)

export function DashboardConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setRawConfig] = React.useState<DashboardConfig>(DEFAULT_CONFIG)

  const setConfig = React.useCallback(
    (partial: DashboardConfig) => {
      setRawConfig((prev) => ({ ...prev, ...partial }))
    },
    []
  )

  const value = React.useMemo(
    () => ({ config, setConfig }),
    [config, setConfig]
  )

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  )
}

export function useDashboardConfig() {
  const ctx = React.useContext(DashboardConfigContext)
  if (!ctx) {
    throw new Error(
      "useDashboardConfig must be used within a DashboardConfigProvider"
    )
  }
  return ctx
}

export type { BreadcrumbItem, DashboardConfig }
