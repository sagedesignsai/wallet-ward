import { ProjectNav } from "@/components/projects/project-nav"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return (
    <div className="flex flex-col gap-4">
      <ProjectNav projectId={projectId} />
      {children}
    </div>
  )
}
