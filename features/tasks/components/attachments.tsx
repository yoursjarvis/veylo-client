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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMediaAnnotations, useCreateAnnotation, useDeleteAnnotation, useUploadNewVersion } from "@/features/tasks/hooks/use-tasks"
interface AttachmentItemProps {
  taskId: string
  attachment: Media
  allAttachments?: Media[]
  onDelete: (id: string) => void
  canDelete: boolean
}
interface Annotation {
  id: string
  x: number
  y: number
  content: string
  user?: { name?: string }
}

export function AttachmentItem({
  taskId,
  attachment,
  allAttachments,
  onDelete,
  canDelete,
}: AttachmentItemProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Find all versions of this attachment
  const versions = allAttachments
    ?.filter(a => a.id === attachment.id || a.parentMediaId === attachment.id)
    .sort((a, b) => (b.version || 1) - (a.version || 1)) || [attachment]

  const [activeVersionId, setActiveVersionId] = useState(attachment.id)
  const activeVersion = versions.find(v => v.id === activeVersionId) || attachment

  // Version Upload Mutation
  const uploadVersionMutation = useUploadNewVersion(attachment.id, taskId)

  // Annotations Mutations & Queries
  const { data: annotations = [] } = useMediaAnnotations(isPreviewOpen ? activeVersion.id : null)
  const createAnnotationMutation = useCreateAnnotation(activeVersion.id)
  const deleteAnnotationMutation = useDeleteAnnotation(activeVersion.id)

  const [annotationInput, setAnnotationInput] = useState("")
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null)

  const isImage = activeVersion.mimeType?.startsWith("image/")
  const isPdf = activeVersion.mimeType === "application/pdf"
  const canPreview = isImage || isPdf

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isImage) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTempCoords({ x, y })
  }

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempCoords || !annotationInput.trim()) return
    createAnnotationMutation.mutate({
      x: tempCoords.x,
      y: tempCoords.y,
      content: annotationInput,
    }, {
      onSuccess: () => {
        setAnnotationInput("")
        setTempCoords(null)
      }
    })
  }

  const getFileIcon = () => {
    if (isImage) return null
    if (isPdf) return <HugeiconsIcon icon={File02Icon} className="h-8 w-8 text-destructive" />

    return <HugeiconsIcon icon={File02Icon} className="h-8 w-8 text-muted-foreground/50" />
  }

  const getThumbnailUrl = (url: string) => {
    if (!url) return url
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const filename = pathParts.pop()
      if (filename) {
        urlObj.pathname = [...pathParts, 'conversions', `thumb-${filename}`].join('/')
        return urlObj.toString()
      }
    } catch {
      const parts = url.split('/')
      const filename = parts.pop()
      if (filename) {
        return [...parts, 'conversions', `thumb-${filename}`].join('/')
      }
    }
    return url
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-muted/20 transition hover:bg-muted/40">
      <div className="flex flex-1 items-center justify-center p-4">
        {isImage ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-sm">
            <Image
              src={(attachment.generatedConversions as Record<string, { url: string }>)?.thumbnail?.url || getThumbnailUrl(attachment.url)}
              alt={attachment.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1 rounded-full bg-background/80 p-1 backdrop-blur-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPreviewOpen(true)
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-primary-foreground transition hover:bg-primary"
                  title="View Proof"
                >
                  <HugeiconsIcon icon={EyeIcon} size={14} />
                </button>
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-primary-foreground transition hover:bg-primary"
                  title="Download"
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                </a>
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDeleteDialogOpen(true)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-primary-foreground transition hover:bg-destructive"
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
                      title="View Proof"
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsDeleteDialogOpen(true)
                      }}
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
        {versions.length > 1 && (
          <span className="shrink-0 bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-muted-foreground">
            v{versions[0].version || 1}
          </span>
        )}
      </div>

      {/* Main Proofing / Interactive Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-7xl w-[95vw] p-0 overflow-hidden flex flex-col md:flex-row h-[85vh]">
          {/* Left panel: Media viewer */}
          <div className="flex-1 bg-background flex flex-col items-center justify-center p-4 relative overflow-auto">
            {isImage ? (
              <div
                className="relative cursor-crosshair max-w-full max-h-[70vh] shadow-2xl rounded"
                onClick={handleImageClick}
              >
                <Image
                  src={activeVersion.url}
                  alt={activeVersion.name}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-[70vh] w-auto h-auto select-none object-contain"
                  unoptimized
                />

                {/* Render Saved Annotation Pins */}
                {annotations.map((anno: Annotation, idx: number) => (
                  <div
                    key={anno.id}
                    className="absolute w-6 h-6 bg-destructive border border-primary-foreground text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition"
                    style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
                    title={anno.content}
                  >
                    {idx + 1}
                  </div>
                ))}

                {/* Render Temp Annotation Pin Input */}
                {tempCoords && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-6 h-6 bg-warning border border-border text-warning-foreground rounded-full flex items-center justify-center text-xs font-bold animate-pulse shadow-lg mb-1">
                      +
                    </div>
                    <form
                      onSubmit={handleAddAnnotation}
                      className="bg-card border border-border p-2 rounded shadow-2xl w-48 text-xs flex flex-col gap-1.5"
                    >
                      <input
                        type="text"
                        placeholder="Add feedback..."
                        className="border border-border rounded px-1.5 py-1 text-xs text-foreground bg-background"
                        value={annotationInput}
                        onChange={(e) => setAnnotationInput(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setTempCoords(null)}
                          className="h-5 text-[10px]"
                        >
                          Cancel
                        </Button>
                        <Button size="xs" type="submit" className="h-5 text-[10px]">
                          Save
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : isPdf ? (
              <iframe
                src={`${activeVersion.url}#toolbar=0`}
                className="w-full h-full border-none"
                title={activeVersion.name}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <HugeiconsIcon icon={File02Icon} size={48} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preview not available.
                </p>
                <a
                  href={activeVersion.url}
                  download={activeVersion.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} /> Download File
                </a>
              </div>
            )}
          </div>

          {/* Right panel: Versioning & Proofing List sidebar */}
          <div className="w-full md:w-80 border-l border-border bg-card flex flex-col shrink-0 h-full">
            <div className="p-4 border-b border-border space-y-3">
              <div>
                <DialogTitle className="text-sm font-semibold truncate">
                  {attachment.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">Proofing Feedback & History</p>
              </div>

              {/* Version Selector & Upload version */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Version History</label>
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          uploadVersionMutation.mutate(e.target.files[0], {
                            onSuccess: (data) => {
                              setActiveVersionId(data.media_id)
                            }
                          })
                        }
                      }}
                      disabled={uploadVersionMutation.isPending}
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      className="h-6 text-[10px] font-medium"
                      disabled={uploadVersionMutation.isPending}
                    >
                      {uploadVersionMutation.isPending ? "Uploading..." : "New Version"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVersionId(v.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                        v.id === activeVersionId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      v{v.version || 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Proofing notes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Annotations ({annotations.length})
              </label>

              {isImage && (
                <p className="text-[10px] text-muted-foreground italic mb-2">
                  Tip: Click anywhere on the image to place a feedback pin.
                </p>
              )}

              {annotations.length > 0 ? (
                <div className="space-y-2.5">
                  {annotations.map((anno: Annotation, idx: number) => (
                    <div
                      key={anno.id}
                      className="p-2 border border-border/80 rounded bg-muted/20 space-y-1 relative group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[9px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-foreground">
                          {anno.user?.name || "Member"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{anno.content}</p>

                      <button
                        onClick={() => deleteAnnotationMutation.mutate(anno.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-0.5"
                        title="Delete annotation"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed border-border/80 rounded">
                  No annotations added yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attachment &quot;{attachment.name}&quot; and all its historical versions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(attachment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
