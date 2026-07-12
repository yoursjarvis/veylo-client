"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQueryState } from "nuqs"
import { useProject } from "../layout"
import { authClient } from "@/lib/auth-client"
import { useDocs, DocVersion, ProjectDoc } from "@/features/docs/hooks/useDocs"
import { DocsSidebar } from "@/features/docs/components/DocsSidebar"
import { DocsEditor } from "@/features/docs/components/DocsEditor"
import { DocsVersions } from "@/features/docs/components/DocsVersions"
import { DocsComments } from "@/features/docs/components/DocsComments"
import { DocsShare } from "@/features/docs/components/DocsShare"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Clock,
  ChevronRight,
  FolderIcon,
  Trash2,
  Copy,
  Pin,
  Star,
  Loader2,
  FileText,
} from "lucide-react"

export default function DocsPage() {
  const { projectId } = useProject()
  const { data: session } = authClient.useSession()
  const user = session?.user

  // Use nuqs to manage active doc ID in URL query parameters (for deep linking)
  const [activeDocId, setActiveDocId] = useQueryState("docId")

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

  // Auto-select first document on load if none selected
  useEffect(() => {
    if (!activeDocId && docs.length > 0) {
      const defaultDoc = docs.find((d) => !d.parentId && !d.deleted && !d.archived)
      if (defaultDoc) {
        setActiveDocId(defaultDoc.id)
      }
    }
  }, [docs, activeDocId, setActiveDocId])

  // Reset preview version and panels when active document changes (React 19 pattern during render)
  const [prevActiveDocId, setPrevActiveDocId] = useState<string | null>(null)
  if (activeDocId !== prevActiveDocId) {
    setPrevActiveDocId(activeDocId)
    setPreviewVersion(null)
    setIsVersionsOpen(false)
    setIsCommentsOpen(false)
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
      trail.unshift({ id: activeCurrent.id, title: activeCurrent.title, emoji: activeCurrent.emoji })
      current = activeCurrent.parentId ? docs.find((d) => d.id === activeCurrent.parentId) : undefined
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

  if (isDocsLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full gap-4 p-6">
        <Skeleton className="w-64 h-full shrink-0 rounded-xl" />
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-center">
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
    <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden border border-border/40 rounded-xl bg-background/50 backdrop-blur-md">
      {/* Sidebar Tree Navigation */}
      <DocsSidebar
        projectId={projectId}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onCreateDoc={handleCreateDoc}
      />

      {/* Editor & Content Canvas Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {activeDocId && activeDoc ? (
          <>
            {/* Header toolbar for this doc */}
            <div className="flex h-12 items-center justify-between border-b border-border bg-card/20 px-6 shrink-0 select-none">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <FolderIcon className="h-3.5 w-3.5" />
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                    <button
                      onClick={() => setActiveDocId(crumb.id)}
                      className={`hover:text-foreground font-semibold truncate shrink-0 max-w-[120px] ${
                        idx === breadcrumbs.length - 1 ? "text-foreground" : ""
                      }`}
                    >
                      {crumb.emoji && <span className="mr-1">{crumb.emoji}</span>}
                      {crumb.title || "Untitled"}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action buttons (Favorite, Comments, History, Share) */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleToggleFavorite}
                  className={`h-8 w-8 rounded-lg ${
                    isFavorite ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500" : ""}`} />
                </Button>

                <Button
                  size="icon"
                  variant={isCommentsOpen ? "secondary" : "ghost"}
                  onClick={() => {
                    setIsCommentsOpen(!isCommentsOpen)
                    setIsVersionsOpen(false)
                    setPreviewVersion(null)
                  }}
                  className="h-8 w-8 rounded-lg text-muted-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>

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
                  className="h-8 w-8 rounded-lg text-muted-foreground"
                >
                  <Clock className="h-4 w-4" />
                </Button>

                <DocsShare projectId={projectId} docId={activeDoc.id} docTitle={activeDoc.title} />

                <div className="h-4 w-px bg-border mx-1" />

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDuplicate}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Collaborative Editor Panel */}
            <div className="flex flex-1 min-h-0 min-w-0">
              <DocsEditor
                key={activeDoc.id}
                projectId={projectId}
                docId={activeDoc.id}
                userId={user.id}
                userName={user.name}
                userEmail={user.email}
                userAvatar={user.image || null}
                previewVersion={previewVersion}
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

              {/* Comments sidebar */}
              {isCommentsOpen && (
                <DocsComments
                  key={activeDoc.id}
                  projectId={projectId}
                  docId={activeDoc.id}
                  userId={user.id}
                  isWorkspaceAdmin={user.role === "owner" || user.role === "admin"}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty Page state */
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 bg-card/10 select-none">
            <div className="rounded-2xl border border-dashed border-border/80 p-8 flex flex-col items-center max-w-sm text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Select a Document</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Choose a page from the sidebar hierarchy to start collaborating in real-time, or create a brand new page.
                </p>
              </div>
              <Button onClick={() => handleCreateDoc(null)} disabled={isCreatingDoc} size="sm" className="h-9 font-semibold">
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
