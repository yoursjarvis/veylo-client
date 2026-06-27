"use client"

import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip-card"
import { axiosInstance } from "@/lib/axios"
import { Editor, mergeAttributes, Range } from "@tiptap/core"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Mention from "@tiptap/extension-mention"
import Placeholder from "@tiptap/extension-placeholder"
import type { EditorView } from "@tiptap/pm/view"
import {
  EditorContent,
  Extension,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  ReactRenderer,
  useEditor,
  type NodeViewProps,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion"
import { all, createLowlight } from "lowlight"
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react"
import React, { useEffect, useRef } from "react"
/* eslint-disable @next/next/no-img-element */
import { toast } from "sonner"
import tippy, { Instance as TippyInstance } from "tippy.js"
import { MentionList, MentionListRef } from "./mention-list"
import {
  CommandItem,
  SlashCommandList,
  SlashCommandListRef,
} from "./slash-command-list"

const lowlight = createLowlight(all)

const editorMembersMap = new Map<
  string,
  {
    user: { id: string; name?: string; image?: string | null; email?: string }
  }[]
>()

function CodeBlockComponent({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const languages = ["auto", ...extension.options.lowlight.listLanguages()]

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const filtered = languages.filter((lang: string) =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const displayValue = defaultLanguage || "auto"

  return (
    <NodeViewWrapper className="code-block group/code relative my-3">
      <div
        ref={containerRef}
        className="absolute top-2 right-2 z-20 inline-block text-left opacity-0 transition-opacity group-hover/code:opacity-100 focus-within:opacity-100"
        contentEditable={false}
        data-combobox-container="true"
      >
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
            setSearchQuery("")
          }}
          className="flex h-7 cursor-pointer items-center justify-between gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all select-none hover:bg-muted hover:text-foreground"
        >
          <span className="capitalize">{displayValue}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/80"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown Panel */}
        {open && (
          <div className="absolute right-0 z-50 mt-1 flex max-h-56 w-44 flex-col rounded-md border border-border bg-background p-1.5 shadow-lg">
            {/* Search Input */}
            <div className="relative mb-1.5">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Options List */}
            <div className="max-h-40 space-y-0.5 overflow-y-auto pr-0.5">
              {filtered.length === 0 ? (
                <div className="px-2 py-1.5 text-center text-xs text-muted-foreground/80">
                  No results found
                </div>
              ) : (
                filtered.map((lang: string) => {
                  const isSelected =
                    (defaultLanguage === "" && lang === "auto") ||
                    defaultLanguage === lang
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        updateAttributes({
                          language: lang === "auto" ? "" : lang,
                        })
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-all hover:bg-muted hover:text-foreground ${
                        isSelected
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{lang}</span>
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/20 font-mono text-sm leading-relaxed">
        <code className={defaultLanguage ? `language-${defaultLanguage}` : ""}>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  )
}

function SafeAvatar({
  src,
  name,
  size,
}: {
  src?: string | null
  name: string
  size: number
}) {
  const [hasError, setHasError] = React.useState(false)
  const [prevSrc, setPrevSrc] = React.useState(src)

  if (src !== prevSrc) {
    setPrevSrc(src)
    setHasError(false)
  }

  const initials = name?.charAt(0).toUpperCase() || "?"

  if (src && !hasError) {
    return (
      <span
        className="relative flex shrink-0 overflow-hidden rounded-full border border-border"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          onError={() => setHasError(true)}
          className="aspect-square object-cover"
          style={{
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            margin: 0,
            padding: 0,
            borderRadius: "9999px",
            border: "none",
            display: "block",
          }}
        />
      </span>
    )
  }

  const fontSize =
    size > 20 ? "text-sm font-semibold" : "text-[8px] font-bold leading-none"
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted leading-none text-foreground ${fontSize}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {initials}
    </span>
  )
}

function MentionNodeView({ node }: NodeViewProps) {
  const { label, avatar, email } = node.attrs

  const displayName = label || "Unknown User"

  const tooltipContent = (
    <div className="flex items-start gap-3 text-left">
      <SafeAvatar src={avatar} name={displayName} size={40} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 truncate text-sm leading-none font-semibold text-foreground">
          {displayName}
        </div>
        {email && (
          <div className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <NodeViewWrapper
      as="span"
      className="inline-block select-all"
      style={{ verticalAlign: "middle" }}
    >
      <Tooltip content={tooltipContent} containerClassName="align-middle">
        <span className="inline-flex max-w-37.5 cursor-pointer items-center gap-1 rounded border border-border bg-accent py-0.5 pr-1.5 pl-1 align-middle text-[11px] font-semibold text-accent-foreground select-none">
          <SafeAvatar src={avatar} name={displayName} size={14} />
          <span className="max-w-27.5 truncate">{displayName}</span>
        </span>
      </Tooltip>
    </NodeViewWrapper>
  )
}

const CustomMention = Mention.extend({
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {}
          return { "data-id": attributes.id }
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) return {}
          return { "data-label": attributes.label }
        },
      },
      avatar: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-avatar"),
        renderHTML: (attributes) => {
          if (!attributes.avatar) return {}
          return { "data-avatar": attributes.avatar }
        },
      },
      email: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-email"),
        renderHTML: (attributes) => {
          if (!attributes.email) return {}
          return { "data-email": attributes.email }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
      {
        tag: "span.mention",
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `${this.options.suggestion.char}${node.attrs.label || node.attrs.id}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView)
  },
})

// Custom slash command extension
const SlashCommand = Extension.create<{ suggestion: Omit<SuggestionOptions, 'editor'> }>({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: { command: (editor: Editor, range: Range) => void }
        }) => {
          props.command(editor, range)
        },
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  projectMembers?: {
    user: { id: string; name?: string; image?: string | null; email?: string }
  }[]
  className?: string
  minHeight?: string
  onSubmit?: () => void
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Write something...",
  projectMembers = [],
  className = "",
  minHeight = "120px",
  onSubmit,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastEmittedValueRef = useRef(value)

  const editorId = React.useId()
  editorMembersMap.set(editorId, projectMembers || [])

  React.useEffect(() => {
    return () => {
      editorMembersMap.delete(editorId)
    }
  }, [editorId])

  const [htmlContent, setHtmlContent] = React.useState<string | null>(null)

  useEffect(() => {
    if (htmlContent === null) return
    const timeout = setTimeout(() => {
      onChange(htmlContent)
    }, 150)
    return () => clearTimeout(timeout)
  }, [htmlContent, onChange])

  // Helper: upload image and insert in editor
  const uploadAndInsertImage = async (file: File, view: EditorView) => {
    const formData = new FormData()
    formData.append("file", file)

    const promise = axiosInstance.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    toast.promise(promise, {
      loading: "Uploading image...",
      success: (response: { data: { data: { url: string } } }) => {
        const url = response.data.data.url
        const { schema } = view.state
        const node = schema.nodes.image.create({ src: url })
        const transaction = view.state.tr.replaceSelectionWith(node)
        view.dispatch(transaction)
        return "Image uploaded successfully"
      },
      error: "Failed to upload image",
    })
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        },
      }).configure({ lowlight }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md border border-border my-2",
        },
      }),
      CustomMention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          char: "@",
          items: ({ query }: { query: string }) => {
            return (editorMembersMap.get(editorId) || [])
              .filter((m) =>
                m.user?.name?.toLowerCase().includes(query.toLowerCase())
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
                component = new ReactRenderer(MentionList, {
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
                  (component?.ref as MentionListRef | undefined)?.onKeyDown(
                    props
                  ) || false
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
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      lastEmittedValueRef.current = html
      setHtmlContent(html)
    },
    onBlur: () => {
      setHtmlContent(null)
      if (editor) {
        onChange(editor.getHTML())
      }
      onBlur?.()
    },
    editorProps: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-combobox-container]")
          ) {
            return true
          }
          return false
        },
        pointerdown: (view, event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-combobox-container]")
          ) {
            return true
          }
          return false
        },
        click: (view, event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-combobox-container]")
          ) {
            return true
          }
          return false
        },
        keydown: (view, event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-combobox-container]")
          ) {
            return true
          }
          return false
        },
        keyup: (view, event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-combobox-container]")
          ) {
            return true
          }
          return false
        },
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          if (onSubmit) {
            event.preventDefault()
            onSubmit()
            return true
          }
        }
        return false
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith("image/")) {
            uploadAndInsertImage(file, view)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        if (
          event.clipboardData &&
          event.clipboardData.files &&
          event.clipboardData.files[0]
        ) {
          const file = event.clipboardData.files[0]
          if (file.type.startsWith("image/")) {
            uploadAndInsertImage(file, view)
            return true
          }
        }
        return false
      },
    },
  })

  // Removed projectMembers to CustomMention storage effect to fix react-hooks/immutability

  // Sync content from outside (e.g. when comments clear or description changes externally)
  useEffect(() => {
    if (!editor) return

    if (value === lastEmittedValueRef.current) return

    const currentHTML = editor.getHTML()
    // Standard clean checks
    const valNormalized = value === "" || value === "<p></p>" ? "" : value
    const currentNormalized =
      currentHTML === "" || currentHTML === "<p></p>" ? "" : currentHTML

    if (valNormalized !== currentNormalized) {
      const timeoutId = setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(value)
          lastEmittedValueRef.current = value
        }
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div
        style={{ minHeight }}
        className="w-full animate-pulse rounded-lg border border-border bg-background p-3"
      />
    )
  }

  // Formatting helper triggers
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndInsertImage(e.target.files[0], editor.view)
    }
  }

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background transition-all duration-150 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${className}`}
    >
      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Formatting Toolbar */}
      <div className="z-10 flex items-center justify-between border-t border-border bg-muted/20 px-3 py-1.5 select-none">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("bold") ? "bg-muted text-foreground" : ""
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("italic") ? "bg-muted text-foreground" : ""
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("strike") ? "bg-muted text-foreground" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("bulletList") ? "bg-muted text-foreground" : ""
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("orderedList") ? "bg-muted text-foreground" : ""
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={addLink}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("link") ? "bg-muted text-foreground" : ""
            }`}
            title="Insert Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("code") ? "bg-muted text-foreground" : ""
            }`}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground ${
              editor.isActive("blockquote") ? "bg-muted text-foreground" : ""
            }`}
            title="Quote Block"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Upload Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="text-[10px] font-medium text-muted-foreground/80">
          Type{" "}
          <kbd className="rounded border border-border bg-muted/80 px-1 py-0.5">
            @
          </kbd>{" "}
          to tag,{" "}
          <kbd className="rounded border border-border bg-muted/80 px-1 py-0.5">
            /
          </kbd>{" "}
          for blocks
        </div>
      </div>
    </div>
  )
}
