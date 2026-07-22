import Image from "next/image"
import React from "react"
import { getThumbUrl } from "@/lib/utils"

interface ProjectIconProps {
  icon?: string | null
  className?: string
}

export function ProjectIcon({ icon, className }: ProjectIconProps) {
  const baseClasses =
    "flex items-center justify-center rounded-lg border border-border bg-secondary/30 shadow-xs shrink-0"
  const sizeClasses = "h-8 w-8 text-sm"
  const combinedClasses = className ? `${baseClasses} ${className}` : `${baseClasses} ${sizeClasses}`

  if (!icon) {
    return <span className={combinedClasses}>📁</span>
  }

  if (
    icon.startsWith("http") ||
    icon.startsWith("/") ||
    icon.startsWith("blob:")
  ) {
    const imageUrl = icon.startsWith("blob:")
      ? icon
      : getThumbUrl(icon) || icon
    return (
      <div className={`${combinedClasses} relative overflow-hidden`}>
        <Image
          src={imageUrl}
          alt="Project Icon"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <span className={`${combinedClasses} leading-none`}>
      {icon}
    </span>
  )
}
