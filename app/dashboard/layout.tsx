import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardConfigProvider } from "@/hooks/use-dashboard-config"
import { WorkspacePanelProvider } from "@/context/workspace-panel"
import { WorkspaceLayout } from "@/components/workspace"

export const metadata: Metadata = {
  title: {
    template: "%s | Nimbus",
    default: "Dashboard | Nimbus",
  },
  description: "Nimbus — your AI-first remote workspace.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGate>
      <TooltipProvider>
        <WorkspacePanelProvider>
          <SidebarProvider defaultOpen={false}>
            <DashboardSidebar />
            <SidebarRail />
            <SidebarInset>
              <DashboardConfigProvider>
                <DashboardHeader />
                {/* Full-height content area — WorkspaceLayout handles split-view */}
                <div className="flex flex-1 flex-col overflow-hidden" style={{ height: "calc(100vh - 3rem)" }}>
                  <WorkspaceLayout>
                    {children}
                  </WorkspaceLayout>
                </div>
              </DashboardConfigProvider>
            </SidebarInset>
          </SidebarProvider>
        </WorkspacePanelProvider>
      </TooltipProvider>
    </DashboardAuthGate>
  )
}
