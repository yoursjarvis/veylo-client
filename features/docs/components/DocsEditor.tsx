"use client"

import { SlashCommand } from "@/components/shared/rich-text-editor"
import { CommandItem, SlashCommandList, SlashCommandListRef } from "@/components/shared/slash-command-list"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { axiosInstance } from "@/lib/axios"
import { Editor, Range } from "@tiptap/core"
import { Collaboration } from "@tiptap/extension-collaboration"
import CollaborationCaret from "@tiptap/extension-collaboration-caret"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { Underline } from "@tiptap/extension-underline"
import { EditorContent, EditorContext, ReactRenderer, useEditor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import React, { useEffect, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import tippy, { Instance as TippyInstance } from "tippy.js"

import { Button as TiptapButton } from "@/components/tiptap-ui-primitive/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code,
  ImageIcon as CoverIcon,
  Edit3,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Merge,
  Quote,
  Split,
  Table as TableIcon,
  Trash2,
  Upload,
} from "lucide-react"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import { getSessionToken } from "../actions"
import { DocVersion, useDocs } from "../hooks/useDocs"

// --- Tiptap Core Extensions from Simple Editor ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"

// --- Styles for Tiptap Nodes & Templates ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-templates/simple/simple-editor.scss"

// --- UI Primitives & Components ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "@/components/tiptap-ui/link-popover"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useWindowSize } from "@/hooks/use-window-size"

// --- Theme Toggle ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// Predefined cover gradients
const COVER_GRADIENTS = [
  "linear-gradient(to right, #ff7e5f, #feb47b)", // Sunset
  "linear-gradient(to right, #7f00ff, #e100ff)", // Cosmic
  "linear-gradient(to right, #00c6ff, #0072ff)", // Ocean
  "linear-gradient(to right, #11998e, #38ef7d)", // Forest
  "linear-gradient(to right, #3a7bd5, #3a6073)", // Deep Blue
  "linear-gradient(to right, #ff9966, #ff5e62)", // Sunrise
  "linear-gradient(to right, #0f2027, #203a43, #2c5364)", // Dark Slate
]

// Emojis list
const EMOJIS = ["📝", "📄", "📁", "🚀", "💡", "🎨", "📅", "🔒", "🛠️", "⚙️", "📈", "🔥", "✨", "📚", "💻"]

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  const image = new window.Image()
  image.src = imageSrc
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("No 2d context")
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Canvas is empty"))
      }
    }, "image/png")
  })
}

interface DocsEditorProps {
  projectId: string
  docId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  readOnly?: boolean
  previewVersion: DocVersion | null
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  const { editor } = useTiptapEditor()

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
        <TiptapButton
          type="button"
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          tooltip="Insert Table"
          variant="ghost"
        >
          <TableIcon className="tiptap-button-icon" />
        </TiptapButton>
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <TiptapButton variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </TiptapButton>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function DocsEditor({
  projectId,
  docId,
  userId,
  userName,
  userEmail,
  userAvatar,
  readOnly = false,
  previewVersion = null,
}: DocsEditorProps) {
  const { useDocDetailsQuery, updateDoc } = useDocs(projectId)
  const { data: doc, isLoading } = useDocDetailsQuery(docId)

  const [editor, setEditor] = useState<Editor | null>(null)
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [localTitle, setLocalTitle] = useState(doc?.title || "")
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State hooks for simple editor toolbar and responsiveness
  const isMobile = useIsBreakpoint()
  const { height: windowHeight } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Custom upload image to Veylo server backend instead of mock/local upload
  const uploadImage = async (
    file: File,
    onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal
  ): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await axiosInstance.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress?.({ progress })
        }
      },
      signal: abortSignal,
    })

    const url = response.data?.data?.url
    if (!url) {
      throw new Error("Upload failed, no URL returned")
    }
    return url
  }

  // Derived states to adjust state during render instead of inside useEffect (React 19 pattern)
  const [prevDocId, setPrevDocId] = useState<string | null>(null)
  if (doc && doc.id !== prevDocId) {
    setPrevDocId(doc.id)
    setLocalTitle(doc.title)
  }

  const [prevDocIdAndVersion, setPrevDocIdAndVersion] = useState<string>("")
  const currentKey = `${docId}-${previewVersion ? previewVersion.version : ""}`
  if (currentKey !== prevDocIdAndVersion) {
    setPrevDocIdAndVersion(currentKey)
    setYDoc(null)
    setProvider(null)
    setIsSynced(false)
    setIsOfflineMode(false)
  }

  // Cover crop states
  const [srcImage, setSrcImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setOriginalFile(file)
      setSrcImage(imageUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
  }

  const handleCancelCrop = () => {
    if (srcImage) {
      URL.revokeObjectURL(srcImage)
    }
    setSrcImage(null)
    setOriginalFile(null)
    setCroppedAreaPixels(null)
  }

  const handleCropConfirm = async () => {
    if (!srcImage || !originalFile || !croppedAreaPixels) return
    setIsCropping(true)
    try {
      const croppedBlob = await getCroppedImg(srcImage, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type || "image/png",
      })

      const formData = new FormData()
      formData.append("file", croppedFile)

      const response = await axiosInstance.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const coverUrl = response.data?.data?.url
      if (coverUrl) {
        await handleUpdateCover(coverUrl)
      }
      handleCancelCrop()
    } catch (err) {
      console.error("Error cropping/uploading image:", err)
    } finally {
      setIsCropping(false)
    }
  }

  // Map user ID to a unique color
  const colors = [
    "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6",
    "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6",
    "#10b981", "#22c55e", "#84cc16", "#eab308", "#f97316"
  ]
  const userColor = colors[Math.abs(userId.split("-").join("").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length]

  // Setup dynamic WebSocket connection for Yjs
  useEffect(() => {
    if (!docId || previewVersion) {
      return
    }

    let active = true
    let wsProvider: WebsocketProvider | null = null
    const ydocument = new Y.Doc()

    // Fallback to offline mode if WebSocket connection doesn't sync in 2.5 seconds
    const fallbackTimeout = setTimeout(() => {
      if (active) {
        setIsOfflineMode(true)
      }
    }, 2500)

    const initializeWs = async () => {
      const token = await getSessionToken()
      if (!active) return

      // Resolve WS protocol and host dynamically
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const url = new URL(apiUrl)
      const protocol = url.protocol === "https:" ? "wss:" : "ws:"
      
      const wsUrl = `${protocol}//${url.host}/ws/docs`
      const params: Record<string, string> = token ? { token } : {}

      const providerInstance = new WebsocketProvider(wsUrl, docId, ydocument, { params })
      wsProvider = providerInstance

      providerInstance.awareness.setLocalStateField("user", {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        color: userColor,
      })

      const handleSync = (isSynced: boolean) => {
        if (isSynced && active) {
          clearTimeout(fallbackTimeout)
          setYDoc(ydocument)
          setProvider(providerInstance)
          setIsSynced(true)
        }
      }

      providerInstance.on("sync", handleSync)

      if (providerInstance.synced) {
        handleSync(true)
      }
    }

    initializeWs()

    return () => {
      active = false
      clearTimeout(fallbackTimeout)
      if (wsProvider) {
        wsProvider.disconnect()
      }
      ydocument.destroy()
    }
  }, [docId, userName, userEmail, userAvatar, userColor, previewVersion])



  const rect = useCursorVisibility({
    editor,
    overlayHeight: 44, // Premium simple editor toolbar height is 44px
  })

  // Derived state adjustment during render (React 19 pattern)
  if (!isMobile && mobileView !== "main") {
    setMobileView("main")
  }

  // Clean up timers
  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current)
    }
  }, [])

  // Caret calculation is encapsulated in a sub-component to isolate rendering cycle overhead

  // Mouse move tracker for live cursor presence
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!provider || readOnly || previewVersion) return
    const rect = editorContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    provider.awareness.setLocalStateField("mouse", { x, y, inside: true })
  }

  const handleMouseLeave = () => {
    if (!provider) return
    provider.awareness.setLocalStateField("mouse", { x: 0, y: 0, inside: false })
  }

  // Cover Image update
  const handleUpdateCover = async (coverUrl: string | null) => {
    if (readOnly || previewVersion) return
    await updateDoc({
      id: docId,
      data: { coverImage: coverUrl },
    })
  }

  // Emoji update
  const handleUpdateEmoji = async (emoji: string | null) => {
    if (readOnly || previewVersion) return
    await updateDoc({
      id: docId,
      data: { emoji },
    })
  }

  if (isLoading || !doc) {
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">
        {/* Editor Header Status Skeleton */}
        <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-2.5 shrink-0">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>

        {/* Editor Content Area Skeleton */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Cover Image Skeleton */}
            <Skeleton className="h-48 w-full rounded-xl" />

            {/* Document Header Skeleton */}
            <div className="px-8 pt-4 space-y-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-2/3 rounded-lg" />
            </div>

            {/* Canvas/Content Area Skeletons */}
            <div className="border border-border/30 rounded-xl bg-card/35 p-8 space-y-4">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isEditable = !readOnly && !previewVersion

  return (
    <>
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">
      {/* Editor Header Status (Collaborators Avatars) */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          {previewVersion ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-2xs font-bold text-amber-500">
              <Eye className="h-3 w-3" /> Previewing Version v{previewVersion.version}
            </div>
          ) : readOnly ? (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-2xs font-bold text-muted-foreground">
              <Eye className="h-3 w-3" /> Read Only
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-2xs font-bold text-success">
              <Edit3 className="h-3 w-3" /> Editing Mode
            </div>
          )}
        </div>

        {/* Live Collaborators Bubbles */}
        <CollaboratorsHeaderAvatars provider={provider} userName={userName} userEmail={userEmail} />
      </div>

      {/* Formatting Toolbar */}
      {editor && isEditable && (previewVersion || isSynced || isOfflineMode) && (
        <EditorContext.Provider value={{ editor }}>
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${windowHeight - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        </EditorContext.Provider>
      )}

      {/* Editor Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Cover Image Picker */}
          <div className="relative group/cover h-48 rounded-xl overflow-hidden bg-muted border border-border/40">
            {doc.coverImage ? (
              <div
                style={{ backgroundImage: doc.coverImage.startsWith("linear-gradient") ? doc.coverImage : `url(${doc.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-muted/50 to-muted/80 flex items-center justify-center text-xs text-muted-foreground/50">
                No Cover Image
              </div>
            )}
            
            {isEditable && (
              <div className="absolute right-4 bottom-4 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                <Popover>
                  <PopoverTrigger className="absolute right-4 bottom-4 h-8 gap-1.5 rounded-lg text-xs shadow-md inline-flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3">
                    <CoverIcon className="h-3.5 w-3.5" /> Change Cover
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 space-y-3">
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Select Cover Gradient</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {COVER_GRADIENTS.map((grad, index) => (
                          <div
                            key={index}
                            onClick={() => handleUpdateCover(grad)}
                            style={{ backgroundImage: grad }}
                            className="h-10 rounded-md cursor-pointer hover:scale-105 border border-white/20 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-2.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Custom Cover Image</span>
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    {doc.coverImage && (
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => handleUpdateCover(null)}
                        className="w-full mt-1 text-2xs"
                      >
                        Remove Cover
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Document Header (Emoji, Title) */}
          <div className="relative px-8 pt-4 space-y-3">
            {/* Document Emoji */}
            <div className="flex items-center gap-2">
              {isEditable ? (
                <Popover>
                  <PopoverTrigger className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border/50 text-2xl shadow-sm hover:scale-105 transition-transform">
                    {doc.emoji || "📝"}
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleUpdateEmoji(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border/50 text-2xl">
                  {doc.emoji || "📝"}
                </div>
              )}
            </div>

            {/* Document Title */}
            <input
              type="text"
              value={localTitle}
              disabled={!isEditable}
              onChange={(e) => {
                const newTitle = e.target.value
                setLocalTitle(newTitle)
                if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current)
                titleSaveTimeoutRef.current = setTimeout(async () => {
                  if (readOnly || previewVersion) return
                  await updateDoc({ id: docId, data: { title: newTitle } })
                }, 1500)
              }}
              placeholder="Untitled Document"
              className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight text-foreground focus:outline-none focus:ring-0 placeholder:text-muted-foreground/35"
            />
          </div>

          {/* Interactive Editor Canvas */}
          <div
            ref={editorContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative border border-border/30 rounded-xl bg-card/35 shadow-xs overflow-hidden"
          >
            {(!previewVersion && !isSynced && !isOfflineMode) ? (
              <div className="p-8 space-y-4 min-h-[400px]">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            ) : (
              <DocsEditorCanvas
                yDoc={yDoc}
                provider={provider}
                previewVersion={previewVersion}
                userName={userName}
                userColor={userColor}
                readOnly={readOnly}
                doc={doc}
                isSynced={isSynced}
                isOfflineMode={isOfflineMode}
                setEditor={setEditor}
                uploadImage={uploadImage}
                updateDoc={updateDoc}
                docId={docId}
              />
            )}
          </div>

        </div>
      </div>
    </div>

    {/* Cropper Dialog */}
    <Dialog
      open={!!srcImage}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancelCrop()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Document Cover</DialogTitle>
          <DialogDescription>
            Drag to position and use the slider to zoom. Recommended banner aspect ratio (16:5).
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4 h-72 w-full overflow-hidden rounded-md border bg-muted">
          {srcImage && (
            <Cropper
              image={srcImage}
              crop={crop}
              zoom={zoom}
              aspect={16 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 py-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancelCrop}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCropConfirm}
            disabled={isCropping}
          >
            {isCropping ? "Cropping..." : "Save Cover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}

interface CollaboratorUser {
  name: string
  email: string
  avatar: string | null
  color: string
}

interface CollaboratorMouse {
  x: number
  y: number
  inside: boolean
}

interface CollaboratorSelection {
  anchor: number
  head: number
}

interface CollaboratorState {
  user: CollaboratorUser
  mouse?: CollaboratorMouse
  selection?: CollaboratorSelection
}

interface CollaboratorsHeaderAvatarsProps {
  provider: WebsocketProvider | null
  userName: string
  userEmail: string
}

export function CollaboratorsHeaderAvatars({ provider, userName, userEmail }: CollaboratorsHeaderAvatarsProps) {
  const [collaborators, setCollaborators] = useState<Record<string, CollaboratorState>>({})

  // Reset collaborators state during render when provider changes/becomes null (React 19 derived state pattern)
  const [prevProvider, setPrevProvider] = useState<WebsocketProvider | null>(null)
  if (provider !== prevProvider) {
    setPrevProvider(provider)
    if (!provider && Object.keys(collaborators).length > 0) {
      setCollaborators({})
    }
  }

  useEffect(() => {
    if (!provider) {
      return
    }

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const newCollaborators: Record<string, CollaboratorState> = {}
      states.forEach((state: unknown, clientID: number) => {
        const collabState = state as CollaboratorState
        if (collabState.user) {
          newCollaborators[clientID.toString()] = {
            user: collabState.user,
            mouse: collabState.mouse,
            selection: collabState.selection,
          }
        }
      })
      setCollaborators(newCollaborators)
    }

    provider.awareness.on("change", handleAwarenessChange)
    handleAwarenessChange()

    return () => {
      provider.awareness.off("change", handleAwarenessChange)
    }
  }, [provider])

  return (
    <div className="flex items-center -space-x-1.5">
      {Object.entries(collaborators).map(([clientId, collab]) => (
        <HoverCard key={clientId}>
          <HoverCardTrigger
            style={{ borderColor: collab.user.color }}
            className="cursor-pointer rounded-full border-2 hover:z-25 transition-all shrink-0 bg-background overflow-hidden p-0 outline-hidden"
          >
            <Avatar size="sm">
              <AvatarImage src={collab.user.avatar || ""} />
              <AvatarFallback className="text-[10px] font-bold">
                {collab.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="w-60 p-4" align="end" sideOffset={8}>
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="border-2" style={{ borderColor: collab.user.color }}>
                <AvatarImage src={collab.user.avatar || ""} />
                <AvatarFallback className="text-sm font-bold">
                  {collab.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-none truncate">
                  {collab.user.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {collab.user.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: collab.user.color }}
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {collab.user.email === userEmail ? "You (Editing)" : "Active now"}
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  )
}

interface CollaboratorsPresenceOverlayProps {
  provider: WebsocketProvider | null
  userName: string
}

export function CollaboratorsPresenceOverlay({
  provider,
  userName,
}: CollaboratorsPresenceOverlayProps) {
  const [collaborators, setCollaborators] = useState<Record<string, CollaboratorState>>({})

  // Reset collaborators state during render when provider changes/becomes null (React 19 derived state pattern)
  const [prevProvider, setPrevProvider] = useState<WebsocketProvider | null>(null)
  if (provider !== prevProvider) {
    setPrevProvider(provider)
    if (!provider && Object.keys(collaborators).length > 0) {
      setCollaborators({})
    }
  }

  useEffect(() => {
    if (!provider) {
      return
    }

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const newCollaborators: Record<string, CollaboratorState> = {}
      states.forEach((state: unknown, clientID: number) => {
        const collabState = state as CollaboratorState
        if (collabState.user) {
          newCollaborators[clientID.toString()] = {
            user: collabState.user,
            mouse: collabState.mouse,
            selection: collabState.selection,
          }
        }
      })
      setCollaborators(newCollaborators)
    }

    provider.awareness.on("change", handleAwarenessChange)
    handleAwarenessChange()

    return () => {
      provider.awareness.off("change", handleAwarenessChange)
    }
  }, [provider])

  return (
    <>
      {/* Custom Mouse Cursors Overlay */}
      {Object.entries(collaborators).map(([clientId, collab]) => {
        if (
          !collab.mouse ||
          !collab.mouse.inside ||
          collab.user.name === userName
        )
          return null

        const mouseX = `${collab.mouse.x * 100}%`
        const mouseY = `${collab.mouse.y * 100}%`

        return (
          <div
            key={clientId}
            style={{
              left: mouseX,
              top: mouseY,
              position: "absolute",
              pointerEvents: "none",
              transform: "translate(-2px, -2px)",
              transition: "all 0.08s ease-out",
            }}
            className="z-40 flex items-center gap-1.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
              <path
                d="M5.65376 12.3825L17.2003 18.0624C18.1517 18.5309 19.1437 17.5389 18.6752 16.5875L12.9953 5.04098C12.5539 4.14324 11.2662 4.18529 10.8841 5.11309L8.85767 10.0384L5.60276 10.749C4.68652 10.9493 4.71765 12.2618 5.65376 12.3825Z"
                fill={collab.user.color}
              />
            </svg>
            <div
              style={{ backgroundColor: collab.user.color }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md"
            >
              <span>{collab.user.name}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

interface DocsEditorCanvasProps {
  yDoc: Y.Doc | null
  provider: WebsocketProvider | null
  previewVersion: DocVersion | null
  userName: string
  userColor: string
  readOnly: boolean
  doc: any
  isSynced: boolean
  isOfflineMode: boolean
  setEditor: (editor: Editor | null) => void
  uploadImage: (
    file: File,
    onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal
  ) => Promise<string>
  updateDoc: (params: { id: string; data: any }) => Promise<any>
  docId: string
}

function DocsEditorCanvas({
  yDoc,
  provider,
  previewVersion,
  userName,
  userColor,
  readOnly,
  doc,
  isSynced,
  isOfflineMode,
  setEditor,
  uploadImage,
  updateDoc,
  docId,
}: DocsEditorCanvasProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: uploadImage,
        onError: (error) => console.error("Upload failed:", error),
      }),
      Placeholder.configure({
        placeholder: "Write something brilliant... Use / for commands",
      }),
      SlashCommand.configure({
        suggestion: {
          char: "/",
          items: ({ query }: { query: string }) => {
            const items: CommandItem[] = [
              {
                title: "Heading 1",
                description: "Big section heading",
                icon: Heading1,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .setNode("heading", { level: 1 })
                    .run()
                },
              },
              {
                title: "Heading 2",
                description: "Medium section heading",
                icon: Heading2,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .setNode("heading", { level: 2 })
                    .run()
                },
              },
              {
                title: "Heading 3",
                description: "Small section heading",
                icon: Heading3,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .setNode("heading", { level: 3 })
                    .run()
                },
              },
              {
                title: "Bullet List",
                description: "Create a simple bulleted list",
                icon: List,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .toggleBulletList()
                    .run()
                },
              },
              {
                title: "Numbered List",
                description: "Create a list with numbering",
                icon: ListOrdered,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .toggleOrderedList()
                    .run()
                },
              },
              {
                title: "Task List",
                description: "Create a checklist",
                icon: CheckSquare,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .toggleTaskList()
                    .run()
                },
              },
              {
                title: "Blockquote",
                description: "Insert a quote block",
                icon: Quote,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .toggleBlockquote()
                    .run()
                },
              },
              {
                title: "Code Block",
                description: "Insert a code block",
                icon: Code,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .toggleCodeBlock()
                    .run()
                },
              },
              {
                title: "Table",
                description: "Insert a 3x3 table",
                icon: TableIcon,
                command: (ed: unknown, range: unknown) => {
                  ;(ed as Editor)
                    .chain()
                    .focus()
                    .deleteRange(range as Range)
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                },
              },
            ]

            return items
              .filter((item) =>
                item.title.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 10)
          },
          render: () => {
            let component: ReactRenderer
            let popup: TippyInstance[]

            return {
              onStart: (props: {
                editor: Editor
                clientRect?: (() => DOMRect | null) | null
              }) => {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) return

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                })
              },

              onUpdate(props: {
                editor: Editor
                clientRect?: (() => DOMRect | null) | null
              }) {
                component.updateProps(props)

                if (!props.clientRect) return

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              },

              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === "Escape") {
                  popup[0].hide()
                  return true
                }

                return (
                  (
                    component?.ref as SlashCommandListRef | undefined
                  )?.onKeyDown(props) || false
                )
              },

              onExit() {
                popup[0]?.destroy()
                component?.destroy()
              },
            }
          },
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ...(yDoc && !previewVersion
        ? [
            Collaboration.configure({
              document: yDoc,
            }),
            ...(provider
              ? [
                  CollaborationCaret.configure({
                    provider: provider,
                    user: {
                      name: userName,
                      color: userColor,
                    },
                  }),
                ]
              : []),
          ]
        : []),
    ],
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[400px] px-8 py-6",
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.startsWith("image"))

        if (imageItem) {
          const file = imageItem.getAsFile()
          if (file) {
            event.preventDefault()
            const editor = (view.dom as any).editor as Editor

            uploadImage(file).then((url) => {
              if (url && editor && !editor.isDestroyed) {
                editor.commands.setImage({
                  src: url,
                  alt: file.name.replace(/\.[^/.]+$/, "") || "pasted-image",
                })
              }
            }).catch((err) => {
              console.error("Paste upload failed:", err)
            })

            return true
          }
        }
        return false
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        const imageFile = files.find((file) => file.type.startsWith("image"))

        if (imageFile) {
          event.preventDefault()
          const editor = (view.dom as any).editor as Editor

          uploadImage(imageFile).then((url) => {
            if (url && editor && !editor.isDestroyed) {
              editor.commands.setImage({
                src: url,
                alt: imageFile.name.replace(/\.[^/.]+$/, "") || "dropped-image",
              })
            }
          }).catch((err) => {
            console.error("Drop upload failed:", err)
          })

          return true
        }
        return false
      },
    },
    onSelectionUpdate: ({ editor }) => {
      if (!provider) return
      const { anchor, head } = editor.state.selection
      provider.awareness.setLocalStateField("selection", { anchor, head })
    },
    onUpdate: ({ editor }) => {
      if (readOnly || previewVersion) return

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      saveTimeoutRef.current = setTimeout(async () => {
        const content = editor.getJSON()
        const plainText = editor.getText()
        await updateDoc({
          id: docId,
          data: { content, plainText },
        })
      }, 2500)
    },
  }, [yDoc, provider, previewVersion])

  useEffect(() => {
    setEditor(editor)
    return () => {
      setEditor(null)
    }
  }, [editor, setEditor])

  useEffect(() => {
    if (!editor || editor.isDestroyed || !doc || !doc.content) return

    if (isSynced && provider && yDoc) {
      const fragment = yDoc.getXmlFragment("default")
      if (fragment.length === 0 || fragment.toString() === "") {
        editor.commands.setContent(doc.content)
      }
    } else if (isOfflineMode && editor.isEmpty) {
      editor.commands.setContent(doc.content)
    }
  }, [provider, yDoc, editor, doc, isSynced, isOfflineMode])

  useEffect(() => {
    if (editor && !editor.isDestroyed && previewVersion) {
      editor.commands.setContent(previewVersion.content)
      editor.setEditable(false)
    } else if (editor && !editor.isDestroyed) {
      editor.setEditable(!readOnly)
    }
  }, [editor, previewVersion, readOnly])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  if (!editor) return null

  return (
    <EditorContext.Provider value={{ editor }}>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }: { editor: Editor }) => editor.isActive("table")}
      >
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground">
          {/* Row Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            tooltip="Insert Row Above"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            tooltip="Insert Row Below"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            tooltip="Delete Row"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </TiptapButton>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Column Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            tooltip="Insert Column Left"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            tooltip="Insert Column Right"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            tooltip="Delete Column"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 rotate-90" />
          </TiptapButton>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Cell Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!editor.can().mergeCells()}
            tooltip="Merge Cells"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Merge className="h-4 w-4" />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!editor.can().splitCell()}
            tooltip="Split Cell"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Split className="h-4 w-4" />
          </TiptapButton>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Table Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            tooltip="Delete Table"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </TiptapButton>
        </div>
      </BubbleMenu>

      <div className="simple-editor-content">
        <EditorContent editor={editor} />
      </div>

      <CollaboratorsPresenceOverlay
        provider={provider}
        userName={userName}
      />
    </EditorContext.Provider>
  )
}
