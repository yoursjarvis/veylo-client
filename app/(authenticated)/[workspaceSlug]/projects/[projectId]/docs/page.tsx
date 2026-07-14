"use client"

import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { DocsEditor } from "@/features/docs/components/DocsEditor"
import { DocsShare } from "@/features/docs/components/DocsShare"
import { DocsSidebar } from "@/features/docs/components/DocsSidebar"
import { DocsVersions } from "@/features/docs/components/DocsVersions"
import { DocVersion, ProjectDoc, useDocs } from "@/features/docs/hooks/useDocs"
import { useQueryState } from "nuqs"
import React, { useEffect, useState } from "react"
import { useProject } from "../layout"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Comment01Icon,
  CopyPlusIcon,
  Delete02Icon,
  SidebarLeft01Icon,
  StarIcon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChevronRight,
  Clock,
  FileText,
  FolderIcon,
  Loader2,
} from "lucide-react"

export default function DocsPage() {
  const { projectId, selectedProject } = useProject()
  const { data: auth, isLoading: isAuthLoading } = useCurrentUser()
  const user = auth?.user

  // Use nuqs to manage active doc ID in URL query parameters (for deep linking)
  const [activeDocId, setActiveDocId] = useQueryState("docId")
  const [commentId, setCommentId] = useQueryState("commentId")

  const {
    useProjectDocsQuery,
    createDoc,
    isCreatingDoc,
    toggleFavorite,
    deleteDoc,
    duplicateDoc,
  } = useDocs(projectId)

  const { data: docs = [], isLoading: isDocsLoading } = useProjectDocsQuery()

  // Local panel state
  const [isVersionsOpen, setIsVersionsOpen] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<DocVersion | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Auto-select first document on load if none selected
  useEffect(() => {
    if (!activeDocId && docs.length > 0) {
      const defaultDoc = docs.find(
        (d) => !d.parentId && !d.deleted && !d.archived
      )
      if (defaultDoc) {
        setActiveDocId(defaultDoc.id)
      }
    }
  }, [docs, activeDocId, setActiveDocId])

  // Auto-open comments panel if a comment is highlighted (React 19 pattern during render)
  const [prevCommentId, setPrevCommentId] = useState<string | null>(null)
  if (commentId !== prevCommentId) {
    setPrevCommentId(commentId)
    if (activeDocId && commentId) {
      setIsCommentsOpen(true)
      setIsVersionsOpen(false)
    }
  }

  // Reset preview version and panels when active document changes (React 19 pattern during render)
  const [prevActiveDocId, setPrevActiveDocId] = useState<string | null>(null)
  if (activeDocId !== prevActiveDocId) {
    setPrevActiveDocId(activeDocId)
    setPreviewVersion(null)
    setIsVersionsOpen(false)
    setIsCommentsOpen(false)
    setCommentId(null)
  }

  // Get active doc details
  const activeDoc = docs.find((d) => d.id === activeDocId)

  // Calculate local breadcrumbs
  const getBreadcrumbs = () => {
    if (!activeDocId) return []
    const trail: { id: string; title: string; emoji?: string | null }[] = []
    let current: ProjectDoc | undefined = docs.find((d) => d.id === activeDocId)
    while (current) {
      const activeCurrent = current
      trail.unshift({
        id: activeCurrent.id,
        title: activeCurrent.title,
        emoji: activeCurrent.emoji,
      })
      current = activeCurrent.parentId
        ? docs.find((d) => d.id === activeCurrent.parentId)
        : undefined
    }
    return trail
  }

  const breadcrumbs = getBreadcrumbs()

  // Add root or nested document
  const handleCreateDoc = async (parentId?: string | null) => {
    const newDoc = await createDoc({
      title: "Untitled Page",
      parentId: parentId || null,
      emoji: "📄",
    })
    setActiveDocId(newDoc.id)
  }

  const handleToggleFavorite = async () => {
    if (!activeDoc) return
    const isFav = activeDoc.favorites?.[0]?.isFavorite ?? false
    await toggleFavorite({ id: activeDoc.id, data: { isFavorite: !isFav } })
  }

  const handleDuplicate = async () => {
    if (!activeDoc) return
    const newDoc = await duplicateDoc(activeDoc.id)
    setActiveDocId(newDoc.id)
  }

  const handleDelete = async () => {
    if (!activeDoc) return
    if (confirm("Move this page to Trash? It can be restored later.")) {
      await deleteDoc(activeDoc.id)
      setActiveDocId(null)
    }
  }

  if (isDocsLoading || isAuthLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full gap-4 p-6">
        <Skeleton className="h-full w-64 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="flex-1 rounded-xl" />
        </div>
      </div>
    )
  }

  const isFavorite = activeDoc?.favorites?.[0]?.isFavorite ?? false

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl border border-border/40 bg-background/50 backdrop-blur-md">
      {/* Sidebar Tree Navigation */}
      <div
        className={`flex h-full shrink-0 flex-col border-r border-border bg-card/40 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <DocsSidebar
          projectId={projectId}
          activeDocId={activeDocId}
          onSelectDoc={setActiveDocId}
          onCreateDoc={handleCreateDoc}
        />
      </div>

      {/* Editor & Content Canvas Container */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {activeDocId && activeDoc ? (
          <>
            {/* Header toolbar for this doc */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/20 px-6 select-none">
              {/* Breadcrumbs */}
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="mr-1 h-8 w-8 shrink-0 rounded-lg text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={SidebarLeft01Icon}
                          size={18}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="right">
                    {isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                  </TooltipContent>
                </Tooltip>
                <FolderIcon className="h-3.5 w-3.5 shrink-0" />
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && (
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    )}
                    <button
                      onClick={() => setActiveDocId(crumb.id)}
                      className={`max-w-30 shrink-0 truncate font-semibold hover:text-foreground ${
                        idx === breadcrumbs.length - 1 ? "text-foreground" : ""
                      }`}
                    >
                      {crumb.emoji && (
                        <span className="mr-1">{crumb.emoji}</span>
                      )}
                      {crumb.title || "Untitled"}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action buttons (Favorite, Comments, History, Share) */}
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleToggleFavorite}
                        className={`h-9 w-9 rounded-lg ${
                          isFavorite
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <HugeiconsIcon
                          icon={StarIcon}
                          className={isFavorite ? "fill-amber-500" : ""}
                          size={26}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant={isCommentsOpen ? "secondary" : "ghost"}
                        onClick={() => {
                          const nextVal = !isCommentsOpen
                          setIsCommentsOpen(nextVal)
                          setIsVersionsOpen(false)
                          setPreviewVersion(null)
                          if (!nextVal) {
                            setCommentId(null)
                          }
                        }}
                        className="h-9 w-9 rounded-lg text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={Comment01Icon}
                          size={26}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">
                    {isCommentsOpen ? "Hide Comments" : "Show Comments"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant={isVersionsOpen ? "secondary" : "ghost"}
                        onClick={() => {
                          const nextVal = !isVersionsOpen
                          setIsVersionsOpen(nextVal)
                          setIsCommentsOpen(false)
                          if (!nextVal) {
                            setPreviewVersion(null)
                          }
                        }}
                        className="h-9 w-9 rounded-lg text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={TransactionHistoryIcon}
                          size={26}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">
                    {isVersionsOpen
                      ? "Hide Version History"
                      : "Version History"}
                  </TooltipContent>
                </Tooltip>

                <DocsShare
                  projectId={projectId}
                  docId={activeDoc.id}
                  docTitle={activeDoc.title}
                />

                <div className="mx-1 h-4 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleDuplicate}
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <HugeiconsIcon
                          icon={CopyPlusIcon}
                          size={26}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">Duplicate Doc</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleDelete}
                        className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={26}
                          strokeWidth={2}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">Delete Doc</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Collaborative Editor Panel */}
            <div className="flex min-h-0 min-w-0 flex-1">
              <DocsEditor
                key={activeDoc.id}
                projectId={projectId}
                docId={activeDoc.id}
                userId={String(user.id)}
                userName={user.name || ""}
                userEmail={user.email}
                userAvatar={user.image || null}
                previewVersion={previewVersion}
                members={selectedProject?.members || []}
                isCommentsOpen={isCommentsOpen}
              />

              {/* Version History Slider Overlay */}
              {isVersionsOpen && (
                <DocsVersions
                  key={activeDoc.id}
                  projectId={projectId}
                  docId={activeDoc.id}
                  selectedVersionId={previewVersion?.id || null}
                  onSelectVersion={setPreviewVersion}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty Page state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-card/10 p-8 select-none">
            <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-border/80 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Select a Document
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Choose a page from the sidebar hierarchy to start
                  collaborating in real-time, or create a brand new page.
                </p>
              </div>
              <Button
                onClick={() => handleCreateDoc(null)}
                disabled={isCreatingDoc}
                size="sm"
                className="h-9 font-semibold"
              >
                {isCreatingDoc ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Create New Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
