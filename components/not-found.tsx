import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon, CompassIcon } from "@hugeicons/core-free-icons"

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="mask-b-from-20% mask-b-to-80% text-9xl font-extrabold">
            404
          </EmptyTitle>
          <EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
            The page you&apos;re looking for might have been <br />
            moved or doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button render={<a href="#" />} nativeButton={false}>
              <HugeiconsIcon
                icon={Home01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Go Home
            </Button>

            <Button
              variant="outline"
              render={<a href="#" />}
              nativeButton={false}
            >
              <HugeiconsIcon
                icon={CompassIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />{" "}
              Explore
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
