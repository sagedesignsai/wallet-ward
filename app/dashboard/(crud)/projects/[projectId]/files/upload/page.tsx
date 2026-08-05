"use client"

import { use } from "react"
import { useRouter } from "nextjs-toploader/app"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { FileUpload } from "@/components/files/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function FileUploadPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <FileUploadInner projectId={projectId} />
}

function FileUploadInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { project, isLoading: projectLoading } = useProject(projectId)

  useDashboardConfigStore.setState({
    title: "Upload File",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Projects", href: "/dashboard/projects" },
      {
        label: project?.name ?? "Project",
        href: `/dashboard/projects/${projectId}`,
      },
      { label: "Files", href: `/dashboard/projects/${projectId}/files` },
      { label: "Upload" },
    ],
  })

  const handleSuccess = (fileId: string) => {
    toast.success("File uploaded successfully")
    router.push(`/dashboard/projects/${projectId}/files/${fileId}`)
  }

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}/files`)
  }

  if (projectLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <FileUpload
        projectId={projectId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
