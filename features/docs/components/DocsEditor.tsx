"use client"

import React, { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react"
import { Editor, Range } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { Highlight } from "@tiptap/extension-highlight"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { Link } from "@tiptap/extension-link"
import { Image } from "@tiptap/extension-image"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Collaboration } from "@tiptap/extension-collaboration"
import { SlashCommand } from "@/components/shared/rich-text-editor"
import { SlashCommandList, SlashCommandListRef, CommandItem } from "@/components/shared/slash-command-list"
import tippy, { Instance as TippyInstance } from "tippy.js"
import Cropper from "react-easy-crop"
import { axiosInstance } from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { useDocs, DocVersion } from "../hooks/useDocs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Code,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Smile,
  ImageIcon as CoverIcon,
  Loader2,
  Eye,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Upload,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  userAvatar: string | null
  readOnly?: boolean
  previewVersion: DocVersion | null
}

export function DocsEditor({
  projectId,
  docId,
  userId,
  userName,
  userAvatar,
  readOnly = false,
  previewVersion = null,
}: DocsEditorProps) {
  const { useDocDetailsQuery, updateDoc } = useDocs(projectId)
  const { data: doc, isLoading } = useDocDetailsQuery(docId)

  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [localTitle, setLocalTitle] = useState("")
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (doc) {
      setLocalTitle(doc.title)
    }
  }, [doc?.id, doc?.title])

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
      setYDoc(null)
      setProvider(null)
      return
    }

    const docName = `doc-${docId}`
    const ydocument = new Y.Doc()
    
    // Resolve WS protocol and host dynamically
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    const url = new URL(apiUrl)
    const protocol = url.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${url.host}/ws/docs/${docId}`

    const wsProvider = new WebsocketProvider(wsUrl, docName, ydocument)

    wsProvider.awareness.setLocalStateField("user", {
      name: userName,
      avatar: userAvatar,
      color: userColor,
    })

    // Collaborator changes are subscribed to inside child components to isolate re-render performance

    setYDoc(ydocument)
    setProvider(wsProvider)

    return () => {
      wsProvider.disconnect()
      ydocument.destroy()
    }
  }, [docId, userName, userAvatar, userColor, previewVersion])



  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false }),
      Image,
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
      ...(yDoc && !previewVersion
        ? [
            Collaboration.configure({
              document: yDoc,
            }),
          ]
        : []),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[400px] px-8 py-6",
      },
    },
    // Update local selection inside Yjs Awareness
    onSelectionUpdate: ({ editor }) => {
      if (!provider) return
      const { anchor, head } = editor.state.selection
      provider.awareness.setLocalStateField("selection", { anchor, head })
    },
    // Autosave handler (triggered on update)
    onUpdate: ({ editor }) => {
      if (readOnly || previewVersion) return

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      // Debounce saving database updates to 2.5 seconds
      saveTimeoutRef.current = setTimeout(async () => {
        const content = editor.getJSON()
        const plainText = editor.getText()
        await updateDoc({
          id: docId,
          data: { content, plainText },
        })
      }, 2500)
    },
  }, [yDoc, previewVersion])

  // Synchronize initial content from DB if Yjs room is fresh/empty
  useEffect(() => {
    if (!provider || !yDoc || !editor || !doc || !doc.content) return

    const handleSync = (isSynced: boolean) => {
      if (isSynced) {
        const fragment = yDoc.getXmlFragment("default")
        // If Yjs is completely empty, populate it with the DB content
        if (fragment.length === 0 || fragment.toString() === "") {
          editor.commands.setContent(doc.content)
        }
      }
    }

    provider.on("sync", handleSync)
    
    // In case it has already synced before this effect runs
    if (provider.synced) {
      handleSync(true)
    }

    return () => {
      provider.off("sync", handleSync)
    }
  }, [provider, yDoc, editor, doc])

  // Clean up timers
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current)
    }
  }, [])

  // Update preview version state when changed
  useEffect(() => {
    if (editor && previewVersion) {
      editor.commands.setContent(previewVersion.content)
      editor.setEditable(false)
    } else if (editor) {
      editor.setEditable(!readOnly)
    }
  }, [editor, previewVersion, readOnly])

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
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading editor...</span>
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
        <CollaboratorsHeaderAvatars provider={provider} userName={userName} />
      </div>

      {/* Formatting Toolbar */}
      {editor && isEditable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-card/65 px-4 py-1.5 shrink-0">
          <Button
            size="icon"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 rounded-lg"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("highlight") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="icon"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 rounded-lg"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 rounded-lg"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={editor.isActive("taskList") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="h-8 w-8 rounded-lg"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const url = prompt("Enter Link URL:")
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
            className="h-8 w-8 rounded-lg"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const url = prompt("Enter Image URL:")
              if (url) editor.chain().focus().setImage({ src: url }).run()
            }}
            className="h-8 w-8 rounded-lg"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="h-8 w-8 rounded-lg"
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            className="h-8 w-8 rounded-lg"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
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
            <EditorContent editor={editor} />

            {/* Custom Carets Overlay */}
            {/* Custom Cursors and Carets overlays */}
            <CollaboratorsPresenceOverlay
              editor={editor}
              provider={provider}
              userName={userName}
              editorContainerRef={editorContainerRef}
            />
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

interface CollaboratorsHeaderAvatarsProps {
  provider: WebsocketProvider | null
  userName: string
}

export function CollaboratorsHeaderAvatars({ provider, userName }: CollaboratorsHeaderAvatarsProps) {
  const [collaborators, setCollaborators] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!provider) {
      setCollaborators({})
      return
    }

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const newCollaborators: Record<string, any> = {}
      states.forEach((state: any, clientID: number) => {
        if (state.user) {
          newCollaborators[clientID.toString()] = {
            user: state.user,
            mouse: state.mouse,
            selection: state.selection,
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
        <Popover key={clientId}>
          <PopoverTrigger className="cursor-pointer rounded-full border-2 hover:z-25 transition-all shrink-0 bg-background overflow-hidden p-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={collab.user.avatar || ""} />
              <AvatarFallback className="text-[10px] font-bold">
                {collab.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2 text-center text-xs font-semibold">
            {collab.user.name} {collab.user.name === userName ? "(You)" : "(Active)"}
          </PopoverContent>
        </Popover>
      ))}
    </div>
  )
}

interface CollaboratorsPresenceOverlayProps {
  editor: Editor | null
  provider: WebsocketProvider | null
  userName: string
  editorContainerRef: React.RefObject<HTMLDivElement | null>
}

export function CollaboratorsPresenceOverlay({
  editor,
  provider,
  userName,
  editorContainerRef,
}: CollaboratorsPresenceOverlayProps) {
  const [collaborators, setCollaborators] = useState<Record<string, any>>({})
  const [editorCoords, setEditorCoords] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!provider) {
      setCollaborators({})
      return
    }

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const newCollaborators: Record<string, any> = {}
      states.forEach((state: any, clientID: number) => {
        if (state.user) {
          newCollaborators[clientID.toString()] = {
            user: state.user,
            mouse: state.mouse,
            selection: state.selection,
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

  useEffect(() => {
    if (!editor) return

    const updateCarets = () => {
      const newCoords: Record<string, any> = {}
      const rect = editorContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      let hasChanged = false
      Object.entries(collaborators).forEach(([clientId, collab]) => {
        if (collab.selection && collab.selection.head) {
          try {
            const headPos = collab.selection.head
            const resolvedCoords = editor.view.coordsAtPos(headPos)
            if (resolvedCoords) {
              const x = resolvedCoords.left - rect.left
              const y = resolvedCoords.top - rect.top
              const height = resolvedCoords.bottom - resolvedCoords.top

              const prev = editorCoords[clientId]
              if (!prev || prev.x !== x || prev.y !== y || prev.height !== height) {
                newCoords[clientId] = { x, y, height }
                hasChanged = true
              } else {
                newCoords[clientId] = prev
              }
            }
          } catch (e) {
            // Out of bounds or document loading
          }
        }
      })

      if (hasChanged || Object.keys(newCoords).length !== Object.keys(editorCoords).length) {
        setEditorCoords(newCoords)
      }
    }

    const interval = setInterval(updateCarets, 150)
    return () => clearInterval(interval)
  }, [editor, collaborators, editorCoords, editorContainerRef])

  return (
    <>
      {/* Custom Carets Overlay */}
      {Object.entries(editorCoords).map(([clientId, coord]) => {
        const collab = collaborators[clientId]
        if (!collab || collab.user.name === userName) return null

        return (
          <div
            key={clientId}
            style={{
              left: coord.x,
              top: coord.y,
              height: coord.height,
              position: "absolute",
              pointerEvents: "none",
            }}
            className="z-30 w-[2px] transition-all duration-75"
          >
            {/* Blinking colored caret */}
            <div
              style={{ backgroundColor: collab.user.color }}
              className="w-[2px] h-full animate-[pulse_1s_infinite]"
            />
            {/* Tooltip containing Username */}
            <div
              style={{ backgroundColor: collab.user.color }}
              className="absolute bottom-full left-0 mb-1 rounded px-1 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-sm translate-x-[-50%]"
            >
              {collab.user.name}
            </div>
          </div>
        )
      })}

      {/* Custom Mouse Cursors Overlay */}
      {Object.entries(collaborators).map(([clientId, collab]) => {
        if (
          !collab.mouse ||
          !collab.mouse.inside ||
          collab.user.name === userName
        )
          return null

        const rect = editorContainerRef.current?.getBoundingClientRect()
        if (!rect) return null

        const mouseX = collab.mouse.x * rect.width
        const mouseY = collab.mouse.y * rect.height

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
