import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl mx-auto border border-primary/20 shadow-inner">
          404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page or secret resource you are looking for does not exist or has been moved.
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
