import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-xl transition-all duration-300 hover:border-foreground/20">
        <div className="text-primary animate-pulse text-7xl font-black tracking-widest">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>
        <div className="pt-2 w-full">
          <Link href="/" passHref legacyBehavior>
            <Button className="w-full font-semibold gap-2">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              Go Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
