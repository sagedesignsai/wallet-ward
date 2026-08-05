import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ProjectInitializer } from "@/stores/project-initializer"
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
          <SidebarInset className="relative flex min-h-0 flex-col">
            <PageBackground />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </DashboardAuthGate>
  )
}
