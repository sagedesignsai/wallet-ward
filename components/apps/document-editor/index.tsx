"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { AppProps } from "@/types/desktop/app"

export interface DocumentContent {
  title: string
  body: string
  resourceId?: string
  projectId?: string
  editable?: boolean
}

export function DocumentEditorApp({ content }: AppProps) {
  const docContent = (content ?? { title: "Untitled", body: "" }) as DocumentContent
  const [body, setBody] = useState(docContent.body)
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-1.5">
        <span className="text-xs font-medium">{docContent.title}</span>
        <div className="flex items-center gap-1">
          {docContent.editable && (
            <Button
              size="sm"
              variant={editing ? "default" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {editing ? (
          <textarea
            className="w-full h-full min-h-[400px] resize-none rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {body || <span className="text-muted-foreground italic">Empty document</span>}
          </div>
        )}
      </div>
    </div>
  )
}
