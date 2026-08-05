import { OrgNav } from "@/components/organizations/org-nav"

export default async function OrgDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  return (
    <div className="flex flex-col gap-4">
      <OrgNav orgId={orgId} />
      {children}
    </div>
  )
}
