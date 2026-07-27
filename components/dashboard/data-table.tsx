"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DataTableSkeleton } from "./data-table-skeleton"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  key: string
  header: string | React.ReactNode
  className?: string
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  loadingRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  onRowClick?: (row: T, index: number) => void
  keyExtractor: (row: T, index: number) => string
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  loadingRows = 5,
  emptyTitle = "No results",
  emptyDescription = "No items found. Try adjusting your search or filters.",
  emptyIcon,
  onRowClick,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border/60 bg-card",
          className
        )}
      >
        <DataTableSkeleton columns={columns.length} rows={loadingRows} />
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border/60 bg-card",
          className
        )}
      >
        <Empty>
          <EmptyHeader>
            {emptyIcon && <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>}
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  // Data table
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-card",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/40 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "h-9 px-2 text-xs font-medium text-muted-foreground",
                  col.className
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={keyExtractor(row, index)}
              className={cn(
                "h-9 border-b border-border/40",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row, index)}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn("h-9 px-2 text-xs", col.className)}
                >
                  {col.render
                    ? col.render(row, index)
                    : String(row[col.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
