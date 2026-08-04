"use client"

import {
  Artifact,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppProps } from "@/types/desktop/app"
import type { TaskContent } from "@/types/desktop/content"

export function TaskApp({ content }: AppProps) {
  const raw = content as TaskContent | undefined
  const taskContent = {
    type: "task" as const,
    title: raw?.title ?? "Task",
    description: raw?.description,
    status: raw?.status ?? "todo",
    resourceId: raw?.resourceId ?? "",
    projectId: raw?.projectId ?? "",
  }

  const statusColors: Record<string, string> = {
    todo: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    done: "bg-green-500/15 text-green-600 dark:text-green-400",
  }

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{taskContent.title}</ArtifactTitle>
        <ArtifactActions>
          <Badge className={cn("text-xs", statusColors[taskContent.status] ?? "bg-muted")}>
            {taskContent.status.replace("_", " ")}
          </Badge>
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        {taskContent.description ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            {taskContent.description}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">No description</p>
        )}
      </ArtifactContent>
    </Artifact>
  )
}