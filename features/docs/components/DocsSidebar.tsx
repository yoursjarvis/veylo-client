"use client"

import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import {
  ArrowRight01Icon,
  CopyIcon,
  Delete02FreeIcons,
  FileEmpty02Icon,
  FolderIcon,
  FolderOpenIcon,
  PlusSignIcon,
  Search01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVertical } from "lucide-react"
import React, { useState } from "react"
import { ProjectDoc, useDocs } from "../hooks/useDocs"

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

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  )
  const [searchQuery, setSearchQuery] = useState("")

  // Filter out deleted docs
  const activeDocs = docs.filter((d) => !d.deleted && !d.archived)

  const rootDocs = activeDocs.filter((d) => d.parentId === null)

  // Map of document ID to the document item
  const docMap: Record<string, ProjectDoc & { children?: string[] }> = {}
  activeDocs.forEach((doc) => {
    docMap[doc.id] = { ...doc, children: [] }
  })

  // Populate children arrays
  activeDocs.forEach((doc) => {
    if (doc.parentId && docMap[doc.parentId]) {
      const parent = docMap[doc.parentId]
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(doc.id)
      }
    }
  })

  // Sort children by order
  Object.values(docMap).forEach((doc) => {
    if (doc.children) {
      doc.children.sort(
        (a, b) => (docMap[a]?.order || 0) - (docMap[b]?.order || 0)
      )
    }
  })

  // Virtual root document
  const rootChildrenIds = activeDocs
    .filter((d) => d.parentId === null)
    .sort((a, b) => a.order - b.order)
    .map((d) => d.id)

  const virtualRoot = {
    id: "root",
    title: "Root",
    children: rootChildrenIds,
  }

  // Convert expandedNodes record to array for headless-tree
  const expandedItems = Object.keys(expandedNodes).filter(
    (key) => expandedNodes[key]
  )
  const setExpandedItems = (
    updaterOrValue: string[] | ((old: string[]) => string[])
  ) => {
    const value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(expandedItems)
        : updaterOrValue
    const nextRecord: Record<string, boolean> = {}
    value.forEach((item) => {
      nextRecord[item] = true
    })
    setExpandedNodes(nextRecord)
  }

  const tree = useTree<unknown>({
    rootItemId: "root",
    getItemName: (item) => {
      const data = item.getItemData() as { title?: string } | undefined
      return data?.title || "Untitled"
    },
    isItemFolder: (item) => {
      const data = item.getItemData() as { children?: unknown[] } | undefined
      return (data?.children?.length ?? 0) > 0
    },
    dataLoader: {
      getItem: (itemId) => (itemId === "root" ? virtualRoot : docMap[itemId]),
      getChildren: (itemId) =>
        itemId === "root" ? rootChildrenIds : (docMap[itemId]?.children ?? []),
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature],
    initialState: {
      selectedItems: activeDocId ? [activeDocId] : [],
      expandedItems,
    },
    setSelectedItems: (
      updaterOrValue: string[] | ((old: string[]) => string[])
    ) => {
      const currentSelected = activeDocId ? [activeDocId] : []
      const value =
        typeof updaterOrValue === "function"
          ? updaterOrValue(currentSelected)
          : updaterOrValue
      if (value.length > 0) {
        const activeId = value[0]
        if (activeId !== "root") {
          onSelectDoc(activeId)
        }
      } else {
        onSelectDoc(null)
      }
    },
    setExpandedItems,
  })

  // Synchronize selection changes from outside the tree component
  React.useEffect(() => {
    const currentSelected = tree.getState().selectedItems || []
    const desired = activeDocId ? [activeDocId] : []
    if (JSON.stringify(currentSelected) !== JSON.stringify(desired)) {
      tree.setSelectedItems(desired)
    }
  }, [activeDocId, tree])

  // Synchronize expanded items changes from outside the tree component
  React.useEffect(() => {
    const currentExpanded = tree.getState().expandedItems || []
    if (JSON.stringify(currentExpanded) !== JSON.stringify(expandedItems)) {
      tree.getConfig().setExpandedItems?.(expandedItems)
    }
  }, [expandedItems, tree])

  // Handle Search filtering
  const filteredDocs = searchQuery
    ? activeDocs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.plainText &&
            d.plainText.toLowerCase().includes(searchQuery.toLowerCase()))
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
    if (
      confirm(
        "Are you sure you want to delete this document? It can be restored later."
      )
    ) {
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

  return (
    <div className="flex h-full w-full flex-col select-none">
      {/* Search Header */}
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground/90">
            Project Docs
          </span>
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
            className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60"
          />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg border-border/50 bg-background/50 pr-4 pl-9 text-xs focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <ScrollArea className="flex-1 px-2 py-3">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-7 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : searchQuery ? (
          // Search Results View
          <div className="space-y-1">
            <span className="px-2 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
              Search Results
            </span>
            {filteredDocs && filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDoc(doc.id)
                    setSearchQuery("")
                  }}
                  className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                    activeDocId === doc.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground/80"
                  }`}
                >
                  <span>{doc.emoji || "📄"}</span>
                  <span className="truncate">{doc.title}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matches found
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Favorites Section */}
            {favorites.length > 0 && (
              <div className="space-y-1">
                <span className="flex items-center gap-1 px-2 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                  <HugeiconsIcon
                    icon={StarIcon}
                    className="h-3 w-3 fill-amber-500 text-amber-500"
                  />{" "}
                  Favorites
                </span>
                {favorites.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                      activeDocId === doc.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80"
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
                <span className="flex items-center gap-1 px-2 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                  Recent Pages
                </span>
                {recents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted ${
                      activeDocId === doc.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80"
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
              <span className="px-2 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                Pages
              </span>
              {rootDocs.length > 0 ? (
                <Tree className="relative space-y-0.5" indent={20} tree={tree}>
                  {tree.getItems().map((item) => {
                    const doc = item.getItemData() as ProjectDoc
                    if (!doc || item.getId() === "root") return null
                    const isFav = doc.favorites?.[0]?.isFavorite ?? false

                    return (
                      <TreeItem
                        key={item.getId()}
                        item={item}
                        render={
                          <div className="group relative flex h-8 cursor-pointer items-center justify-between rounded-lg px-2 text-sm text-foreground/80 transition-all hover:bg-muted/80 data-[selected=true]:bg-primary/10 data-[selected=true]:font-medium data-[selected=true]:text-primary" />
                        }
                      >
                        {/* Guide Lines */}
                        {Array.from({ length: item.getItemMeta().level }).map(
                          (_, i) => (
                            <div
                              key={i}
                              style={{
                                left: `${(i + 0.5) * 20}px`, // aligned with parent's chevron center
                              }}
                              className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-border/15"
                            />
                          )
                        )}
                        <TreeItemLabel className="min-w-0 flex-1 bg-transparent px-0 py-0 hover:bg-transparent">
                          <span className="ms-1 flex min-w-0 items-center gap-2">
                            {item.isFolder() ? (
                              item.isExpanded() ? (
                                <HugeiconsIcon
                                  icon={FolderOpenIcon}
                                  strokeWidth={2}
                                  className="pointer-events-none size-4 shrink-0 text-muted-foreground"
                                />
                              ) : (
                                <HugeiconsIcon
                                  icon={FolderIcon}
                                  strokeWidth={2}
                                  className="pointer-events-none size-4 shrink-0 text-muted-foreground"
                                />
                              )
                            ) : doc.emoji ? (
                              <span className="shrink-0 text-base leading-none">
                                {doc.emoji}
                              </span>
                            ) : (
                              <HugeiconsIcon
                                icon={FileEmpty02Icon}
                                strokeWidth={2}
                                className="pointer-events-none size-4 shrink-0 text-muted-foreground"
                              />
                            )}
                            <span className="truncate pr-1">
                              {doc.title || "Untitled"}
                            </span>
                          </span>
                        </TreeItemLabel>

                        {/* Action Triggers */}
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => handleToggleFavorite(doc, e)}
                            className={`flex h-6 w-6 items-center justify-center rounded-sm hover:bg-muted ${
                              isFav ? "text-amber-500" : "text-muted-foreground"
                            }`}
                          >
                            <HugeiconsIcon
                              icon={StarIcon}
                              className="h-3.5 w-3.5"
                            />
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => onCreateDoc(doc.id)}
                              >
                                <HugeiconsIcon
                                  icon={PlusSignIcon}
                                  className="mr-2 h-4 w-4"
                                />{" "}
                                Add Nested Page
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDuplicate(doc.id, e)}
                              >
                                <HugeiconsIcon
                                  icon={CopyIcon}
                                  className="mr-2 h-4 w-4"
                                />{" "}
                                Duplicate
                              </DropdownMenuItem>
                              {doc.parentId && (
                                <DropdownMenuItem
                                  onClick={() => handleMoveDoc(doc, null)}
                                >
                                  <HugeiconsIcon
                                    icon={ArrowRight01Icon}
                                    className="mr-2 h-4 w-4"
                                  />{" "}
                                  Move to Root
                                </DropdownMenuItem>
                              )}
                              {rootDocs.length > 0 && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted">
                                    <HugeiconsIcon
                                      icon={FolderOpenIcon}
                                      className="mr-2 h-4 w-4"
                                    />{" "}
                                    Move under...
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {activeDocs
                                      .filter(
                                        (d) =>
                                          d.id !== doc.id &&
                                          d.parentId !== doc.id
                                      )
                                      .map((target) => (
                                        <DropdownMenuItem
                                          key={target.id}
                                          onClick={() =>
                                            handleMoveDoc(doc, target.id)
                                          }
                                        >
                                          {target.title}
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(doc.id, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <HugeiconsIcon
                                  icon={Delete02FreeIcons}
                                  className="mr-2 h-4 w-4"
                                />{" "}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TreeItem>
                    )
                  })}
                </Tree>
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
