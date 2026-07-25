import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border/40 pb-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground [&_svg]:size-4">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-none">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-none">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
