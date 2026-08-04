"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Artifact,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact"
import { CodeBlock } from "@/components/ai-elements/code-block"
import type { AppProps } from "@/types/desktop/app"
import type { ArtifactContent as ArtifactContentPayload } from "@/types/desktop/content"

export function ArtifactApp({ content }: AppProps) {
  const raw = content as ArtifactContentPayload | undefined
  const artifactContent = {
    type: "artifact" as const,
    title: raw?.title ?? "Artifact",
    description: raw?.description,
    code: raw?.code,
    language: raw?.language,
    html: raw?.html,
  }
  const [view, setView] = useState<"preview" | "code">(
    artifactContent.html ? "preview" : "code"
  )

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{artifactContent.title}</ArtifactTitle>
        <ArtifactActions>
          {artifactContent.html && artifactContent.code && (
            <div className="flex overflow-hidden rounded-md border border-border/60">
              <Button
                size="sm"
                variant={view === "preview" ? "secondary" : "ghost"}
                className="h-6 rounded-none px-2 text-xs"
                onClick={() => setView("preview")}
              >
                Preview
              </Button>
              <Button
                size="sm"
                variant={view === "code" ? "secondary" : "ghost"}
                className="h-6 rounded-none px-2 text-xs"
                onClick={() => setView("code")}
              >
                Code
              </Button>
            </div>
          )}
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className={view === "preview" ? "p-0" : undefined}>
        {view === "preview" && artifactContent.html ? (
          <iframe
            srcDoc={artifactContent.html}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title={artifactContent.title}
          />
        ) : artifactContent.code ? (
          <CodeBlock
            code={artifactContent.code}
            language={(artifactContent.language ?? "tsx") as any}
          />
        ) : (
          <p className="text-sm italic text-muted-foreground">No content</p>
        )}
      </ArtifactContent>
    </Artifact>
  )
}