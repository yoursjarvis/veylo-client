"use client"

import * as React from "react"

import {
  PreviewLinkCard,
  PreviewLinkCardContent,
  PreviewLinkCardImage,
  PreviewLinkCardTrigger,
  type PreviewLinkCardContentProps,
  type PreviewLinkCardProps,
} from "@/components/animate-ui/components/radix/preview-link-card"
import { cn } from "@/lib/utils"

export type PreviewLinkProps = Omit<PreviewLinkCardProps, "children"> & {
  children?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  contentClassName?: string
  imageClassName?: string
  contentProps?: Omit<PreviewLinkCardContentProps, "children" | "className">
}

export function PreviewLink({
  href,
  src,
  width = 420,
  height = 236,
  viewportWidth = 1440,
  viewportHeight = 900,
  viewportIsMobile = false,
  deviceScaleFactor = 1,
  colorScheme = "light",
  forceRefresh,
  children,
  trigger,
  className,
  contentClassName,
  imageClassName,
  contentProps,
  ...props
}: PreviewLinkProps) {
  return (
    <PreviewLinkCard
      href={href}
      src={src}
      width={width}
      height={height}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      viewportIsMobile={viewportIsMobile}
      deviceScaleFactor={deviceScaleFactor}
      colorScheme={colorScheme}
      forceRefresh={forceRefresh}
      {...props}
    >
      <PreviewLinkCardTrigger>
        {trigger ?? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "font-medium underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              className
            )}
          >
            {children ?? href}
          </a>
        )}
      </PreviewLinkCardTrigger>
      <PreviewLinkCardContent
        className={cn("bg-background p-0", contentClassName)}
        {...contentProps}
      >
        <PreviewLinkCardImage
          alt={`${href} preview`}
          className={cn("block rounded-md object-cover", imageClassName)}
        />
      </PreviewLinkCardContent>
    </PreviewLinkCard>
  )
}
