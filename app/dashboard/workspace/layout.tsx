"use client"

import { useEffect } from "react"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { setConfig } = useDashboardConfig()

    useEffect(() => {
        setConfig({
            title: "Workspace",
            description: "Agent collaboration surface",
            breadcrumbs: [{ label: "Workspace" }],
        })
    }, [setConfig])

    return (
        <div className="h-full overflow-hidden">
            {children}
        </div>
    )
}