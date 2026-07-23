"use client"

import { cn } from "@/lib/utils"
import { getPresetIconEntry, parseIconValue } from "./icon-picker"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderOpenIcon } from "@hugeicons/core-free-icons"
import NextImage from "next/image"

interface ProjectIconProps {
  /** The stored icon value: "icon:Name:#hex", a URL, or null */
  icon?: string | null
  /** Tailwind size classes for the wrapper div, e.g. "h-9 w-9" */
  size?: string
  /** Extra class names for the wrapper */
  className?: string
  /** Icon size class, e.g. "h-4 w-4" */
  iconSize?: string
  /** Whether to use Next/Image fill (for large displays) or fixed size */
  imageFill?: boolean
}

/**
 * Renders a project/workspace icon from its stored string value.
 * Works for preset icons ("icon:Name:#hex"), uploaded images (URLs), or a fallback.
 */
export function ProjectIcon({
  icon,
  size = "h-9 w-9",
  className,
  iconSize = "h-5 w-5",
  imageFill = false,
}: ProjectIconProps) {
  const parsed = parseIconValue(icon)

  const base =
    "flex items-center justify-center rounded-lg shrink-0 overflow-hidden"

  if (parsed.type === "preset") {
    const entry = getPresetIconEntry(parsed.iconName)
    return (
      <div
        className={cn(base, size, className)}
        style={{ backgroundColor: parsed.bgColor }}
      >
        {entry ? (
          <HugeiconsIcon
            icon={entry.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]}
            className={cn(iconSize, "text-white")}
          />
        ) : (
          <HugeiconsIcon
            icon={FolderOpenIcon}
            className={cn(iconSize, "text-white")}
          />
        )}
      </div>
    )
  }

  if (parsed.type === "image") {
    if (imageFill) {
      return (
        <div className={cn(base, size, "relative", className)}>
          <NextImage
            src={parsed.url}
            alt="Icon"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )
    }
    return (
      <div className={cn(base, size, className)}>
        <NextImage
          src={parsed.url}
          alt="Icon"
          width={48}
          height={48}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  // Fallback
  return (
    <div className={cn(base, size, "bg-muted", className)}>
      <HugeiconsIcon
        icon={FolderOpenIcon}
        className={cn(iconSize, "text-muted-foreground")}
      />
    </div>
  )
}
