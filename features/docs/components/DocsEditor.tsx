"use client"

import { Editor, EditorContext } from "@tiptap/react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import React, { useEffect, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"

// --- Components & UI Primitives ---
import { Toolbar } from "@/components/tiptap-ui-primitive/toolbar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

// --- Custom Subcomponents ---
import { CollaboratorsHeaderAvatars } from "./CollaboratorsHeaderAvatars"
import { DocsEditorCanvas } from "./DocsEditorCanvas"
import { MainToolbarContent, MobileToolbarContent } from "./DocsEditorToolbar"
import { DocsComments } from "./DocsComments"

// --- Utilities & Actions ---
import { axiosInstance } from "@/lib/axios"
import { ProjectMember } from "@/types/models"
import { getSessionToken } from "../actions"
import { DocVersion, useDocs } from "../hooks/useDocs"
import { getCroppedImg, resolveAvatarUrl } from "./DocsEditorUtils"

// --- Hooks ---
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"
import {
  Camera01Icon,
  Edit02Icon,
  EyeIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const COVER_GRADIENTS = [
  "linear-gradient(to right, #ff7e5f, #feb47b)", // Sunset
  "linear-gradient(to right, #7f00ff, #e100ff)", // Cosmic
  "linear-gradient(to right, #00c6ff, #0072ff)", // Ocean
  "linear-gradient(to right, #11998e, #38ef7d)", // Forest
  "linear-gradient(to right, #3a7bd5, #3a6073)", // Deep Blue
  "linear-gradient(to right, #ff9966, #ff5e62)", // Sunrise
  "linear-gradient(to right, #0f2027, #203a43, #2c5364)", // Dark Slate
]

interface DocsEditorProps {
  projectId: string
  docId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  readOnly?: boolean
  previewVersion: DocVersion | null
  members?: ProjectMember[]
  isCommentsOpen: boolean
}

export function DocsEditor({
  projectId,
  docId,
  userId,
  userName,
  userEmail,
  userAvatar,
  readOnly = false,
  previewVersion = null,
  members,
  isCommentsOpen,
}: DocsEditorProps) {
  const { useDocDetailsQuery, updateDoc } = useDocs(projectId)
  const { data: doc, isLoading } = useDocDetailsQuery(docId)

  const [editor, setEditor] = useState<Editor | null>(null)
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark")

    const frameId = requestAnimationFrame(() => {
      setIsDarkMode(checkDark())
    })

    const observer = new MutationObserver(() => {
      setIsDarkMode(checkDark())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

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
    "#f43f5e",
    "#ec4899",
    "#d946ef",
    "#a855f7",
    "#8b5cf6",
    "#6366f1",
    "#3b82f6",
    "#0ea5e9",
    "#06b6d4",
    "#14b8a6",
    "#10b981",
    "#22c55e",
    "#84cc16",
    "#eab308",
    "#f97316",
  ]
  const userColor =
    colors[
      Math.abs(
        userId
          .split("-")
          .join("")
          .split("")
          .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      ) % colors.length
    ]

  // Setup dynamic WebSocket connection for Yjs
  const userInfoRef = useRef({ userName, userEmail, userAvatar, userColor })
  useEffect(() => {
    userInfoRef.current = { userName, userEmail, userAvatar, userColor }
  }, [userName, userEmail, userAvatar, userColor])

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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const url = new URL(apiUrl)
      const protocol = url.protocol === "https:" ? "wss:" : "ws:"

      const wsUrl = `${protocol}//${url.host}/ws/docs`
      const params: Record<string, string> = token ? { token } : {}

      const providerInstance = new WebsocketProvider(wsUrl, docId, ydocument, {
        params,
      })
      wsProvider = providerInstance

      providerInstance.awareness.setLocalStateField("user", {
        id: userId,
        name: userInfoRef.current.userName,
        email: userInfoRef.current.userEmail,
        avatar: resolveAvatarUrl(userInfoRef.current.userAvatar),
        color: userInfoRef.current.userColor,
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
  }, [docId, previewVersion, userId])

  // Update local awareness user state when user info changes
  useEffect(() => {
    if (!provider) return

    provider.awareness.setLocalStateField("user", {
      id: userId,
      name: userName,
      email: userEmail,
      avatar: resolveAvatarUrl(userAvatar),
      color: userColor,
    })
  }, [provider, userId, userName, userEmail, userAvatar, userColor])

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
    provider.awareness.setLocalStateField("mouse", {
      x: 0,
      y: 0,
      inside: false,
    })
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
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Editor Header Status Skeleton */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/40 px-6 py-2.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>

        {/* Editor Content Area Skeleton */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Cover Image Skeleton */}
            <Skeleton className="h-48 w-full rounded-xl" />

            {/* Document Header Skeleton */}
            <div className="space-y-4 px-8 pt-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-2/3 rounded-lg" />
            </div>

            {/* Canvas/Content Area Skeletons */}
            <div className="space-y-4 rounded-xl border border-border/30 bg-card/35 p-8">
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
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Editor Header Status (Collaborators Avatars) */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/40 px-6 py-2.5">
          <div className="flex items-center gap-2">
            {previewVersion ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-2xs font-bold text-amber-500">
                <HugeiconsIcon icon={EyeIcon} size={14} strokeWidth={2} />{" "}
                Previewing Version v{previewVersion.version}
              </div>
            ) : readOnly ? (
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-2xs font-bold text-muted-foreground">
                <HugeiconsIcon icon={EyeIcon} size={14} strokeWidth={2} /> Read
                Only
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-2xs font-bold text-success">
                <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={2} />{" "}
                Editing Mode
              </div>
            )}
          </div>

          {/* Live Collaborators Bubbles */}
          <CollaboratorsHeaderAvatars
            provider={provider}
            userEmail={userEmail}
            userId={userId}
            userAvatar={userAvatar}
            members={members}
          />
        </div>

        {/* Formatting Toolbar */}
        {editor &&
          isEditable &&
          (previewVersion || isSynced || isOfflineMode) && (
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
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className={`mx-auto transition-all duration-300 flex gap-8 items-start justify-center ${
            isCommentsOpen ? "max-w-7xl" : "max-w-4xl"
          }`}>
            <div className="flex-1 min-w-0 space-y-4 max-w-4xl">
            {/* Cover Image Picker */}
            <div className="group/cover relative h-48 overflow-hidden rounded-xl border border-border/40 bg-muted">
              {doc.coverImage ? (
                <div
                  style={{
                    backgroundImage: doc.coverImage.startsWith(
                      "linear-gradient"
                    )
                      ? doc.coverImage
                      : `url(${doc.coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-r from-muted/50 to-muted/80 text-xs text-muted-foreground/50">
                  No Cover Image
                </div>
              )}

              {isEditable && (
                <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover/cover:opacity-100">
                  <Popover>
                    <PopoverTrigger className="absolute right-4 bottom-4 inline-flex h-8 w-40 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-sm text-secondary-foreground shadow-md hover:bg-secondary/80">
                      <HugeiconsIcon
                        icon={Camera01Icon}
                        className="h-5 w-5"
                        strokeWidth={2}
                      />{" "}
                      Change Cover
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-3 p-3">
                      <div>
                        <span className="mb-1.5 block text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                          Select Cover Gradient
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COVER_GRADIENTS.map((grad, index) => (
                            <div
                              key={index}
                              onClick={() => handleUpdateCover(grad)}
                              style={{ backgroundImage: grad }}
                              className="h-10 cursor-pointer rounded-md border border-white/20 transition-all hover:scale-105"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border/60 pt-2.5">
                        <span className="mb-1.5 block text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                          Custom Cover Image
                        </span>
                        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60">
                          <HugeiconsIcon
                            icon={Upload01Icon}
                            size={14}
                            strokeWidth={2}
                          />
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
                          className="mt-1 w-full text-2xs"
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
            <div className="relative space-y-3 px-8 pt-4">
              {/* Document Emoji */}
              <div className="flex items-center gap-2">
                {isEditable ? (
                  <Popover>
                    <PopoverTrigger className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card text-2xl shadow-sm transition-transform hover:scale-105">
                      {doc.emoji || "📝"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none">
                      <EmojiPicker
                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                        onEmojiClick={(emojiData) =>
                          handleUpdateEmoji(emojiData.emoji)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card text-2xl">
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
                  if (titleSaveTimeoutRef.current)
                    clearTimeout(titleSaveTimeoutRef.current)
                  titleSaveTimeoutRef.current = setTimeout(async () => {
                    if (readOnly || previewVersion) return
                    await updateDoc({ id: docId, data: { title: newTitle } })
                  }, 1500)
                }}
                placeholder="Untitled Document"
                className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/35 focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Interactive Editor Canvas */}
            <div
              ref={editorContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative overflow-hidden rounded-xl border border-border/30 bg-card/35 shadow-xs"
            >
              {!previewVersion && !isSynced && !isOfflineMode ? (
                <div className="min-h-100 space-y-4 p-8">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              ) : (
                <DocsEditorCanvas
                  projectId={projectId}
                  yDoc={yDoc}
                  provider={provider}
                  previewVersion={previewVersion}
                  userId={userId}
                  userName={userName}
                  userEmail={userEmail}
                  userAvatar={userAvatar}
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

          {/* Comments side column */}
          {isCommentsOpen && (
            <div className="w-80 shrink-0 relative self-stretch">
              <DocsComments
                projectId={projectId}
                docId={docId}
                userId={userId}
                isWorkspaceAdmin={members?.some(
                  (m) =>
                    m.userId === userId &&
                    (m.role === "owner" || m.role === "admin")
                ) || false}
              />
            </div>
          )}
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
              Drag to position and use the slider to zoom. Recommended banner
              aspect ratio (16:5).
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
