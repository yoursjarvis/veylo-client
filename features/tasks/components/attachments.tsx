"use client"

import React, { useState } from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  Cancel01Icon,
  EyeIcon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import { Media } from "@/types/models"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
interface AttachmentItemProps {
  attachment: Media
  onDelete: (id: string) => void
  canDelete: boolean
}

export function AttachmentItem({
  attachment,
  onDelete,
  canDelete,
}: AttachmentItemProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const isImage = attachment.mimeType?.startsWith("image/")
  const isPdf = attachment.mimeType === "application/pdf"
  const canPreview = isImage || isPdf

  const getFileIcon = () => {
    if (isImage) return null
    if (isPdf) return <HugeiconsIcon icon={File02Icon} className="h-8 w-8 text-rose-400" />
    return <HugeiconsIcon icon={File02Icon} className="h-8 w-8 text-muted-foreground/50" />
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-muted/20 transition hover:bg-muted/40">
      <div className="flex flex-1 items-center justify-center p-4">
        {isImage ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-sm">
            <Image
              src={(attachment.generatedConversions as any)?.thumbnail?.url || attachment.url}
              alt={attachment.name}
              fill
              className="object-cover"
              sizes="96px"
            />
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1 rounded-full bg-background/80 p-1 backdrop-blur-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPreviewOpen(true)
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white transition hover:bg-primary"
                  title="View"
                >
                  <HugeiconsIcon icon={EyeIcon} size={14} />
                </button>
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white transition hover:bg-primary"
                  title="Download"
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                </a>
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(attachment.id)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white transition hover:bg-destructive"
                    title="Delete"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative group/icon">
              {getFileIcon()}
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover/icon:opacity-100">
                <div className="flex items-center gap-1 rounded-full bg-background/80 p-1 backdrop-blur-sm">
                  {canPreview && (
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition hover:bg-primary hover:text-primary-foreground"
                      title="View"
                    >
                      <HugeiconsIcon icon={EyeIcon} size={14} />
                    </button>
                  )}
                  <a
                    href={attachment.url}
                    download={attachment.name}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition hover:bg-primary hover:text-primary-foreground"
                    title="Download"
                  >
                    <HugeiconsIcon icon={Download01Icon} size={14} />
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {isPdf && (
              <span className="text-[10px] font-medium text-muted-foreground">
                View PDF
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 bg-background/50 px-2 py-1.5 text-xs">
        <span className="truncate pr-2 font-medium" title={attachment.name}>
          {attachment.name}
        </span>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-sm font-medium truncate">
              {attachment.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted h-[80vh]">
            {isImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={`${attachment.url}#toolbar=0`}
                className="w-full h-full border-none"
                title={attachment.name}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <HugeiconsIcon icon={File02Icon} size={48} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type.
                </p>
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} /> Download File
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
