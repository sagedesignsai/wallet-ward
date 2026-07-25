import { cn } from "@/lib/utils"

type KeyValueItem = {
  label: string
  value: React.ReactNode
}

type KeyValueListProps = {
  items: KeyValueItem[]
  className?: string
}

export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <dl className={cn("flex flex-col gap-px", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline gap-3 rounded-md px-2 py-1.5 even:bg-muted/20"
        >
          <dt className="w-32 shrink-0 text-xs text-muted-foreground">
            {item.label}
          </dt>
          <dd className="min-w-0 flex-1 text-xs text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
