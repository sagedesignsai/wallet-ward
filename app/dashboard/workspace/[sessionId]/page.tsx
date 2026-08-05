"use client"

import { use, useEffect } from "react"
import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { WorkspaceSplitLayout } from "@/components/workspace"

export default function WorkspaceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const selectSession = useWorkspacePanelStore((s) => s.selectSession)
  const sessions = useWorkspacePanelStore((s) => s.sessions)
  const activeSession = useWorkspacePanelStore((s) =>
    s.sessions.find((sess) => sess.id === sessionId)
  )

  useEffect(() => {
    const exists = sessions.some((s) => s.id === sessionId)
    if (exists) {
      selectSession(sessionId)
    }
  }, [sessionId, sessions, selectSession])

  useDashboardConfigStore.setState({
    title: "Workspace",
    description: "Agent collaboration surface",
    breadcrumbs: [{ label: "Workspace" }],
  })

  return <WorkspaceSplitLayout projectId={activeSession?.projectId} />
}
