"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons"
import { DocVersion, useDocs } from "../hooks/useDocs"

const resolveAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("blob:")) {
    return avatarUrl
  }
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.veylo.com:4000/api/v1"
    const origin = new URL(apiUrl).origin
    const relativePath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
    return `${origin}${relativePath}`
  } catch (error) {
    return avatarUrl
  }
}

interface DocsVersionsProps {
  projectId: string
  docId: string
  selectedVersionId: string | null
  onSelectVersion: (version: DocVersion | null) => void
}

export function DocsVersions({
  projectId,
  docId,
  selectedVersionId,
  onSelectVersion,
}: DocsVersionsProps) {
  const { useDocVersionsQuery, restoreVersion } = useDocs(projectId)
  const { data: versions = [], isLoading } = useDocVersionsQuery(docId)

  const handleRestore = async (versionId: string) => {
    if (confirm("Are you sure you want to restore the document to this version? This will create a new version snapshot.")) {
      await restoreVersion({ docId, versionId })
      onSelectVersion(null)
    }
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-border bg-card/40 shrink-0 select-none">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={2} className="text-primary" />
          <span className="text-sm font-semibold tracking-tight text-foreground/90">Version History</span>
        </div>
        {selectedVersionId && (
          <Button
            size="xs"
            variant="ghost"
            className="text-2xs font-semibold text-primary hover:bg-primary/10"
            onClick={() => onSelectVersion(null)}
          >
            Exit Preview
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded bg-muted/40" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No version history found.
          </div>
        ) : (
          <div className="space-y-2.5">
            {versions.map((ver) => {
              const isSelected = selectedVersionId === ver.id
              return (
                <div
                  key={ver.id}
                  onClick={() => onSelectVersion(isSelected ? null : ver)}
                  className={`flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:bg-muted/80 bg-background/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary">
                      Version v{ver.version}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ver.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 shrink-0">
                        {resolveAvatarUrl(ver.creator.image) && (
                          <AvatarImage src={resolveAvatarUrl(ver.creator.image)} />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {ver.creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate text-foreground/80">
                        {ver.creator.name}
                      </span>
                    </div>

                    <Button
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore(ver.id)
                      }}
                      className="h-6 gap-1 px-2 text-[10px] rounded-md font-semibold"
                    >
                      <HugeiconsIcon icon={RotateLeft01Icon} size={14} strokeWidth={2} /> Restore
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
