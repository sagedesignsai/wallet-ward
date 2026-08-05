"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { GitBranchIcon, WarningIcon } from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepositories } from "@/hooks/use-repositories"
import { RepositoryForm } from "@/components/repositories/repository-form"
import type { RepositoryFormOutput } from "@/components/repositories/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"

export default function NewRepositoryPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <NewRepositoryInner projectId={projectId} />
}

function NewRepositoryInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { setConfig } = useDashboardConfig()
  const { project, isLoading: projectLoading } = useProject(projectId)
  const { createRepository } = useRepositories(projectId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setConfig({
      title: "New Repository",
      description: "Connect a Git repository to this project",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name ?? "Project", href: `/dashboard/projects/${projectId}` },
        {
          label: "Repositories",
          href: `/dashboard/projects/${projectId}/repositories`,
        },
        { label: "New" },
      ],
    })
  }, [projectId, project?.name, setConfig])

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningIcon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            This project may have been deleted.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </Empty>
    )
  }

  const handleSubmit = async (data: RepositoryFormOutput) => {
    setIsSubmitting(true)
    try {
      const repo = await createRepository(data)
      if (repo) {
        toast.success("Repository connected successfully")
        router.push(`/dashboard/projects/${projectId}/repositories`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}/repositories`)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranchIcon className="size-4" />
        <span>Connect a Git repository to sync code and track changes.</span>
      </div>
      <RepositoryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
