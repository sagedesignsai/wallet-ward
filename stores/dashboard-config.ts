"use client"

import { create } from "zustand"

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type DashboardConfig = {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

type DashboardConfigState = DashboardConfig

const DEFAULT_CONFIG: DashboardConfig = {
  title: "Dashboard",
  breadcrumbs: [],
  actions: null,
}

/**
 * Global store for the page-supplied header config (title, breadcrumbs,
 * actions).
 *
 * Pages write to it in their render body via `useDashboardConfigStore.setState(...)`
 * (no effects, no context), and `DashboardHeader` subscribes to it.
 * The store holds no parent/provider — it's a plain zustand store like
 * `stores/project-store.ts`.
 */
export const useDashboardConfigStore = create<DashboardConfigState>(() => ({
  ...DEFAULT_CONFIG,
}))
