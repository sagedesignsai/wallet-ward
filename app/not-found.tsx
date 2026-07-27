import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-black text-primary shadow-inner">
          404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The page or secret resource you are looking for does not exist or has
          been moved.
        </p>
        <div className="pt-2">
          <Button asChild size="sm" className="font-semibold">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
