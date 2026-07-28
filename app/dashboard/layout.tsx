import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardConfigProvider } from "@/hooks/use-dashboard-config"
import { ProjectInitializer } from "@/stores/project-initializer"
import { WorkspaceLayout } from "@/components/workspace"
import { PageBackground } from "@/components/dashboard/page-background"

export const metadata: Metadata = {
  title: {
    template: "%s | Flowspace",
    default: "Dashboard | Flowspace",
  },
  description: "Flowspace — your AI-first remote workspace.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGate>
      <TooltipProvider>
        <ProjectInitializer />
        <SidebarProvider defaultOpen={false} className="h-full overflow-hidden">
          <DashboardSidebar />
          <SidebarRail />
          <SidebarInset className="min-h-0 relative">
            <PageBackground />
            <DashboardConfigProvider>
              <DashboardHeader />
              <div className="min-h-0 flex-1 overflow-hidden">
                <WorkspaceLayout>{children}</WorkspaceLayout>
              </div>
            </DashboardConfigProvider>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </DashboardAuthGate>
  )
}
