"use client"

import { useState } from "react"
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from "@/components/ai-elements/file-tree"
import type { AppProps } from "@/types/desktop/app"
import type { FileNode } from "@/stores/workspace-panel-store"

export interface FileManagerContent {
  title: string
  tree: FileNode[]
  selectedPath?: string
  onFileSelect?: (path: string) => void
}

export function FileManagerApp({ content }: AppProps) {
  const raw = content as FileManagerContent | undefined
  const fileContent = {
    title: raw?.title ?? "Files",
    tree: raw?.tree ?? ([] as FileNode[]),
    selectedPath: raw?.selectedPath,
  }
  const [selected, setSelected] = useState(fileContent.selectedPath ?? "")

  function renderNode(node: FileNode) {
    if (node.type === "folder") {
      return (
        <FileTreeFolder key={node.path} path={node.path} name={node.name}>
          {node.children?.map(renderNode)}
        </FileTreeFolder>
      )
    }
    return (
      <FileTreeFile key={node.path} path={node.path} name={node.name} />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-1.5">
        <span className="text-xs font-medium">{fileContent.title}</span>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto p-2">
        <FileTree
          selectedPath={selected}
          onSelect={setSelected}
          defaultExpanded={new Set(["root"])}
          className="border-0 rounded-none bg-transparent"
        >
          {fileContent.tree.map(renderNode)}
        </FileTree>

        {/* Selected file info */}
        {selected && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-2">
            <p className="font-mono text-xs text-muted-foreground truncate">{selected}</p>
          </div>
        )}
      </div>
    </div>
  )
}
