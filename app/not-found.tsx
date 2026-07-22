import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-xl transition-all duration-300 hover:border-foreground/20">
        <div className="animate-pulse text-7xl font-black tracking-widest text-primary">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We couldn&apos;t find the page you were looking for. It might have
            been moved, deleted, or the URL might be incorrect.
          </p>
        </div>
        <div className="w-full pt-2">
          <Link href="/" className="w-full">
            <Button className="w-full gap-2 font-semibold">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              Go Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
