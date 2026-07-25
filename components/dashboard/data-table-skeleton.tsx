import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableSkeletonProps = {
  columns: number
  rows?: number
  className?: string
}

function seededRandom(seed: number): number {
  // Simple deterministic pseudo-random: returns value between 0.4 and 0.9
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return 0.4 + (x - Math.floor(x)) * 0.5
}

export function DataTableSkeleton({
  columns,
  rows = 5,
  className,
}: DataTableSkeletonProps) {
  return (
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow className="border-b border-border/40 hover:bg-transparent">
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead
              key={i}
              className="h-9 px-2 text-xs font-medium text-muted-foreground"
            >
              <Skeleton className="h-3.5 w-16 rounded-sm" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow
            key={rowIndex}
            className="border-b border-border/40 hover:bg-transparent"
          >
            {Array.from({ length: columns }).map((_, colIndex) => {
              const width = Math.round(
                seededRandom(rowIndex * columns + colIndex) * 100
              )
              return (
                <TableCell key={colIndex} className="h-9 px-2">
                  <Skeleton
                    className="h-3.5 rounded-sm"
                    style={{ width: `${width}%` }}
                  />
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
