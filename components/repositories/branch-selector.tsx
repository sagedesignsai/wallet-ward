"use client"

import { useEffect, useState } from "react"
import { GitBranchIcon } from "@phosphor-icons/react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface Branch {
  name: string
  isDefault: boolean
}

interface BranchSelectorProps {
  projectId: string
  repositoryId: string
  value: string
  onChange: (branch: string) => void
  placeholder?: string
}

export function BranchSelector({
  projectId,
  repositoryId,
  value,
  onChange,
  placeholder = "Select branch\u2026",
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchBranches() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/branches`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load branches (${res.status})`)
        }

        const body: { data: Branch[] } = await res.json()
        if (!cancelled) {
          setBranches(body.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load branches."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBranches()
    return () => {
      cancelled = true
    }
  }, [projectId, repositoryId])

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder={isLoading ? "Loading\u2026" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {error && (
          <div className="px-2 py-1.5 text-xs text-destructive">{error}</div>
        )}
        {!error && branches.length > 0 && (
          <>
            <div className="px-2 pt-1 pb-1">
              <Input
                placeholder="Search branches\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-6 text-xs"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            {filtered.map((branch) => (
              <SelectItem key={branch.name} value={branch.name}>
                <span className="flex items-center gap-1.5">
                  <GitBranchIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="font-mono text-xs">{branch.name}</span>
                  {branch.isDefault && (
                    <span className="text-[0.625rem] text-muted-foreground">
                      (default)
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No branches match your search.
              </div>
            )}
          </>
        )}
        {!error && branches.length === 0 && !isLoading && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No branches found.
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
