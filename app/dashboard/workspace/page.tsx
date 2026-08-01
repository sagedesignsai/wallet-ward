"use client"

import { WorkspaceLanding } from "@/components/workspace"

export default function WorkspacePage() {
  return (
    <WorkspaceLanding
      config={{
        title: "Workspace",
        description: "Agent collaboration surface",
        breadcrumbs: [{ label: "Workspace" }],
      }}
    />
  )
}
