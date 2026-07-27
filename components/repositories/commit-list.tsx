import { ArrowSquareOutIcon } from "@phosphor-icons/react"

import { TimeAgo } from "@/components/dashboard/time-ago"

export interface Commit {
  sha: string
  message: string
  author: {
    name: string
  }
  commit: {
    author: {
      date: string
    }
  }
}

interface CommitListProps {
  commits: Commit[]
  repositoryUrl: string
}

export function CommitList({ commits, repositoryUrl }: CommitListProps) {
  const githubUrl = repositoryUrl.replace(/\.git$/, "")

  return (
    <div className="flex flex-col">
      {commits.map((commit) => (
        <div
          key={commit.sha}
          className="flex items-start gap-3 border-b border-border/40 px-3 py-2.5 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <a
                href={`${githubUrl}/commit/${commit.sha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                {commit.sha.slice(0, 7)}
                <ArrowSquareOutIcon className="size-3 shrink-0" />
              </a>
              <span className="text-xs text-muted-foreground">
                {commit.author.name}
              </span>
            </div>
            <p className="line-clamp-1 text-xs text-foreground">
              {commit.message}
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <TimeAgo date={commit.commit.author.date} />
          </div>
        </div>
      ))}
    </div>
  )
}
