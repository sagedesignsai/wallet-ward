import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardConfigProvider } from "@/hooks/use-dashboard-config"

export const metadata: Metadata = {
  title: {
    template: "%s | Wallet Ward",
    default: "Dashboard | Wallet Ward",
  },
  description: "Manage your encrypted secrets, projects, and team access.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGate>
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <DashboardSidebar />
          <SidebarRail />
          <SidebarInset>
            <DashboardConfigProvider>
              <DashboardHeader />
              <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
            </DashboardConfigProvider>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </DashboardAuthGate>
  )
}
