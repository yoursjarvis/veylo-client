import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type * as React from "react"

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-none bg-background shadow-none ring-0", className)}
      {...props}
    />
  )
}
