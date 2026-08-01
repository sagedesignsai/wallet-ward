"use client"

import { use, useEffect } from "react"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { WorkspaceSplitLayout } from "@/components/workspace"

export default function WorkspaceSessionPage({
    params,
}: {
    params: Promise<{ sessionId: string }>
}) {
    const { sessionId } = use(params)
    const { setConfig } = useDashboardConfig()
    const selectSession = useWorkspacePanelStore((s) => s.selectSession)
    const sessions = useWorkspacePanelStore((s) => s.sessions)

    useEffect(() => {
        const exists = sessions.some((s) => s.id === sessionId)
        if (exists) {
            selectSession(sessionId)
        }
    }, [sessionId, sessions, selectSession])

    useEffect(() => {
        setConfig({
            title: "Workspace",
            description: "Agent collaboration surface",
            breadcrumbs: [{ label: "Workspace" }],
        })
    }, [setConfig])

    return <WorkspaceSplitLayout />
}
