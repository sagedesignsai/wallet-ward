"use client"

import {
  Artifact,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact"
import { Badge } from "@/components/ui/badge"
import type { AppProps } from "@/types/desktop/app"
import type { SecretContent } from "@/types/desktop/content"

export function SecretApp({ content }: AppProps) {
  const raw = content as SecretContent | undefined
  const secretContent = {
    type: "secret" as const,
    name: raw?.name ?? "Secret",
    secretType: raw?.secretType ?? "",
    resourceId: raw?.resourceId ?? "",
    projectId: raw?.projectId ?? "",
    environmentId: raw?.environmentId ?? "",
  }

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <ArtifactTitle className="font-mono">{secretContent.name}</ArtifactTitle>
          <Badge variant="outline" className="text-[0.625rem]">
            {secretContent.secretType}
          </Badge>
        </div>
      </ArtifactHeader>
      <ArtifactContent>
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Value</p>
            <p className="font-mono text-sm tracking-widest">••••••••••••••••</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Secret values are masked for security. Use the Secrets tab to reveal values.
          </p>
        </div>
      </ArtifactContent>
    </Artifact>
  )
}