"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { WarningIcon, FileTextIcon, TrashIcon } from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useDocument } from "@/hooks/use-documents"
import { OpenInComputer } from "@/components/workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>
}) {
  const { projectId, documentId } = use(params)
  return <DocumentDetailInner projectId={projectId} documentId={documentId} />
}

function DocumentDetailInner({
  projectId,
  documentId,
}: {
  projectId: string
  documentId: string
}) {
  const router = useRouter()
  const { project } = useProject(projectId)
  const { document, isLoading, isSaving, error, save, remove } = useDocument(
    projectId,
    documentId
  )

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (document) {
      setTitle(document.title)
      setContent(document.content ?? "")
      setDirty(false)
    }
  }, [document])

  if (project && document) {
    useDashboardConfigStore.setState({
      title: document.title,
      actions: (
        <OpenInComputer
          showLabel
          label="Open in Computer"
          size="sm"
          variant="outline"
          tab={{
            type: "document",
            title: document.title,
            content: {
              type: "document",
              title: document.title,
              body: document.content ?? "",
              resourceId: document.id,
              projectId,
              editable: true,
            },
          }}
        />
      ),
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        {
          label: "Documents",
          href: `/dashboard/projects/${projectId}/documents`,
        },
        { label: document.title },
      ],
    })
  }

  const handleSave = async () => {
    const updated = await save({
      title: title.trim(),
      content: content.trim() || null,
    })
    if (updated) {
      setDirty(false)
      toast.success("Document saved")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this document?")) return
    const ok = await remove()
    if (ok) {
      toast.success("Document deleted")
      router.push(`/dashboard/projects/${projectId}/documents`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !document) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <FileTextIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>Document not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This document may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href={`/dashboard/projects/${projectId}/documents`}>
            Back to Documents
          </Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="doc-title">Title</Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="doc-content">Content (Markdown)</Label>
        <Textarea
          id="doc-content"
          className="min-h-[360px] font-mono text-xs"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!dirty || !title.trim() || isSaving}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="ghost"
          className="gap-1.5 text-red-400 hover:text-red-300"
          onClick={handleDelete}
        >
          <TrashIcon className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}
