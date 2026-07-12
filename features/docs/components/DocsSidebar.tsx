"use client"

import React, { useState } from "react"
import { useDocs, ProjectDoc } from "../hooks/useDocs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  PlusSignIcon,
  StarIcon,
  FolderOpenIcon,
  FolderIcon,
  File02Icon,
  Settings02Icon,
  Delete02FreeIcons,
  CopyIcon,
  Share01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { ChevronDown, ChevronRight, MoreVertical, Pin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DocsSidebarProps {
  projectId: string
  activeDocId: string | null
  onSelectDoc: (id: string | null) => void
  onCreateDoc: (parentId?: string | null) => void
}

export function DocsSidebar({
  projectId,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
}: DocsSidebarProps) {
  const {
    useProjectDocsQuery,
    useFavoritesQuery,
    useRecentDocsQuery,
    toggleFavorite,
    deleteDoc,
    duplicateDoc,
    updateDoc,
  } = useDocs(projectId)

  const { data: docs = [], isLoading } = useProjectDocsQuery()
  const { data: favorites = [] } = useFavoritesQuery()
  const { data: recents = [] } = useRecentDocsQuery()

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    // Root documents are usually expanded by default
  })
  const [searchQuery, setSearchQuery] = useState("")

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter out deleted docs
  const activeDocs = docs.filter((d) => !d.deleted && !d.archived)

  // Reconstruct tree hierarchy
  const buildTree = (parentId: string | null): ProjectDoc[] => {
    return activeDocs
      .filter((d) => d.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  }

  const rootDocs = buildTree(null)

  // Handle Search filtering
  const filteredDocs = searchQuery
    ? activeDocs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.plainText && d.plainText.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null

  const handleToggleFavorite = async (doc: ProjectDoc, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFav = doc.favorites?.[0]?.isFavorite ?? false
    await toggleFavorite({ id: doc.id, data: { isFavorite: !isFav } })
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await duplicateDoc(id)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this document? It can be restored later.")) {
      await deleteDoc(id)
      if (activeDocId === id) {
        onSelectDoc(null)
      }
    }
  }

  const handleMoveDoc = async (doc: ProjectDoc, newParentId: string | null) => {
    await updateDoc({
      id: doc.id,
      data: { parentId: newParentId },
    })
  }

  // Recursive Tree Node Renderer
  const renderTreeNode = (doc: ProjectDoc, depth = 0) => {
    const children = buildTree(doc.id)
    const hasChildren = children.length > 0
    const isExpanded = !!expandedNodes[doc.id]
    const isActive = activeDocId === doc.id
    const isFav = doc.favorites?.[0]?.isFavorite ?? false

    return (
      <div key={doc.id} className="select-none">
        {/* Node Label Row */}
        <div
          onClick={() => onSelectDoc(doc.id)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex h-8 cursor-pointer items-center justify-between rounded-lg px-2 text-sm transition-all hover:bg-muted/80 ${
            isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Expand / Collapse Icon */}
            <div
              onClick={(e) => toggleExpand(doc.id, e)}
              className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted text-muted-foreground"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
              )}
            </div>

            {/* Document Icon / Emoji */}
            <span className="text-base shrink-0">
              {doc.emoji || (hasChildren ? "📁" : "📄")}
            </span>

            {/* Title */}
            <span className="truncate pr-1">{doc.title || "Untitled"}</span>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleToggleFavorite(doc, e)}
              className={`flex h-6 w-6 items-center justify-center rounded-sm hover:bg-muted ${
                isFav ? "text-amber-500" : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={StarIcon} className="h-3.5 w-3.5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-muted text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onCreateDoc(doc.id)}>
                  <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" /> Add Nested Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleDuplicate(doc.id, e)}>
                  <HugeiconsIcon icon={CopyIcon} className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                {/* Move node dialog trigger can be implemented or simple actions */}
                {doc.parentId && (
                  <DropdownMenuItem onClick={() => handleMoveDoc(doc, null)}>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="mr-2 h-4 w-4" /> Move to Root
                  </DropdownMenuItem>
                )}
                {rootDocs.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex w-full items-center px-2 py-1.5 text-sm outline-none hover:bg-muted rounded-sm">
                      <HugeiconsIcon icon={FolderOpenIcon} className="mr-2 h-4 w-4" /> Move under...
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {activeDocs
                        .filter((d) => d.id !== doc.id && d.parentId !== doc.id)
                        .map((target) => (
                          <DropdownMenuItem key={target.id} onClick={() => handleMoveDoc(doc, target.id)}>
                            {target.title}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => handleDelete(doc.id, e)} className="text-destructive focus:text-destructive">
                  <HugeiconsIcon icon={Delete02FreeIcons} className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card/40 shrink-0 select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground/90">Project Docs</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
            onClick={() => onCreateDoc(null)}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60"
          />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 text-xs rounded-lg border-border/50 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <ScrollArea className="flex-1 px-2 py-3">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-full animate-pulse rounded bg-muted/40" />
            ))}
          </div>
        ) : searchQuery ? (
          // Search Results View
          <div className="space-y-1">
            <span className="px-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Search Results</span>
            {filteredDocs && filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDoc(doc.id)
                    setSearchQuery("")
                  }}
                  className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                    activeDocId === doc.id ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
                  }`}
                >
                  <span>{doc.emoji || "📄"}</span>
                  <span className="truncate">{doc.title}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">No matches found</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Favorites Section */}
            {favorites.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 px-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  <HugeiconsIcon icon={StarIcon} className="h-3 w-3 text-amber-500 fill-amber-500" /> Favorites
                </span>
                {favorites.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                      activeDocId === doc.id ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
                    }`}
                  >
                    <span>{doc.emoji || "📄"}</span>
                    <span className="truncate">{doc.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Section */}
            {recents.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 px-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Pages
                </span>
                {recents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                      activeDocId === doc.id ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
                    }`}
                  >
                    <span>{doc.emoji || "📄"}</span>
                    <span className="truncate">{doc.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tree Pages Section */}
            <div className="space-y-1">
              <span className="px-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Pages</span>
              {rootDocs.length > 0 ? (
                <div className="space-y-0.5">
                  {rootDocs.map((doc) => renderTreeNode(doc, 0))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No pages yet. Create one!
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
