"use client"

import { Card } from "@/components/ui/card"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function HelpCard() {
  return (
    <Card className="space-y-2 border-primary/10 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-primary">
        <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
        <span className="text-sm font-semibold">Need help?</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Roles let you group permissions so access can be assigned consistently
        across your workspace. Custom roles allow you to define precise access
        levels for different team members.
      </p>
    </Card>
  )
}
