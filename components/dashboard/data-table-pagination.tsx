"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DataTablePaginationProps = {
  pageIndex: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalCount)

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-border/40 bg-background/50 px-3 py-2",
        className
      )}
    >
      <span className="text-xs text-muted-foreground tabular-nums">
        Showing {from}–{to} of {totalCount}
      </span>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v: string) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger size="sm" className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            <CaretLeftIcon />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground min-w-[3ch] text-center">
            {pageIndex + 1}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            <CaretRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
