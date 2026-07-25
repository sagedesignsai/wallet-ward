"use client"

import React, { useEffect, useState, useCallback, use } from "react"
import {
  FileTextIcon,
  PlusIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useDocuments, type Document } from "@/hooks/use-documents"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <DocumentsInner projectId={projectId} />
}

function DocumentsInner({ projectId }: { projectId: string }) {
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { documents, isLoading, error, refetch, createDocument } =
    useDocuments(projectId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setConfig({
        description: `${project.name} — ${documents.length} document${documents.length !== 1 ? "s" : ""}`,
        actions: (
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            New Document
          </Button>
        ),
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          {
            label: project.name,
            href: `/dashboard/projects/${projectId}`,
          },
          { label: "Documents" },
        ],
      })
    }
  }, [project, documents.length, setConfig])

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return
    setSubmitting(true)
    const result = await createDocument({
      title: title.trim(),
      content: content.trim() || undefined,
    })
    if (result) {
      setDialogOpen(false)
      setTitle("")
      setContent("")
    }
    setSubmitting(false)
  }, [title, content, createDocument])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {documents.length === 0 ? (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Create your first document to start writing project notes and
              specs.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-content">Content (Markdown)</Label>
              <Textarea
                id="doc-content"
                placeholder="Write your content here..."
                className="min-h-[160px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!title.trim() || submitting}
            >
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocumentCard({ doc }: { doc: Document }) {
  const excerpt = doc.content
    ? doc.content.slice(0, 120).replace(/[#*_`~\[\]]/g, "")
    : "No content"

  return (
    <Card className="gap-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <CardHeader className="border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/50 text-muted-foreground">
            <FileTextIcon className="size-3" />
          </div>
          <CardTitle className="truncate text-sm">{doc.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
          {excerpt}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[0.625rem] text-muted-foreground">
          <span>
            Updated <TimeAgo date={doc.updatedAt} />
          </span>
          {doc.createdBy && (
            <span>by {doc.createdBy.name}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
