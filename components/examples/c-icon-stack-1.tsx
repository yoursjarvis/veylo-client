import { IconStack } from "@/components/reui/icon-stack"
import { HugeiconsIcon } from "@hugeicons/react"
import { Layers01Icon } from "@hugeicons/core-free-icons"

export function Pattern() {
  return (
    <div className="flex items-center justify-center">
      <IconStack aria-hidden="true">
        <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} className="size-4" />
      </IconStack>
    </div>
  )
}
