"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

function ShimmerBlock({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-background/55 to-transparent"
        animate={reduceMotion ? undefined : { x: ["0%", "320%"] }}
        transition={{
          duration: 1.6,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
        }}
      />
    </div>
  )
}

export function ShimmerSkeletonBox({ className }: { className?: string }) {
  return <ShimmerBlock className={className} />
}

export function ShimmerSkeleton({
  lines = 3,
  avatar = false,
  className,
}: {
  lines?: number
  avatar?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex w-full gap-3", className)} aria-hidden="true">
      {avatar ? (
        <ShimmerBlock className="size-10 shrink-0 rounded-full" />
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <ShimmerBlock
            key={index}
            className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  )
}
