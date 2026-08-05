import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function CrudLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </>
  )
}
