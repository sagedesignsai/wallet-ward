"use client"

import { CodeBlock } from "@/components/ai-elements/code-block"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CopyIcon } from "@phosphor-icons/react"
import { useCallback } from "react"
import { toast } from "sonner"
import type { AppProps } from "@/types/desktop/app"

export interface CodeEditorContent {
  code: string
  language: string
  filename?: string
  resourceId?: string
  readOnly?: boolean
}

export function CodeEditorApp({ content, onClose }: AppProps) {
  const codeContent = (content ?? { code: "", language: "text" }) as CodeEditorContent

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeContent.code)
    toast.success("Copied to clipboard")
  }, [codeContent.code])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {codeContent.filename ?? "Untitled"}
          </span>
          {codeContent.language && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {codeContent.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleCopy}
          >
            <CopyIcon className="size-3" />
            Copy
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <CodeBlock code={codeContent.code} language={codeContent.language as any} />
      </div>
    </div>
  )
}
