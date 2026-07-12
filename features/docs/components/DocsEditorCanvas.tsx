"use client"

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
import {
  EditorContent,
  EditorContext,
  ReactRenderer,
  useEditor,
} from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import React, { useEffect, useRef } from "react"
import tippy, { Instance as TippyInstance } from "tippy.js"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"

import { SlashCommand } from "@/components/shared/rich-text-editor"
import {
  CommandItem,
  SlashCommandList,
  SlashCommandListRef,
} from "@/components/shared/slash-command-list"
import { Button as TiptapButton } from "@/components/tiptap-ui-primitive/button"
import {
  CheckmarkSquare01Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CodeIcon,
  Delete02Icon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  TableIcon as HugeiconsTableIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  PathfinderMergeIcon,
  QuoteUpIcon,
  SplitIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const createHugeIcon = (
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
) => {
  const IconWrapper = ({ className, ...props }: { className?: string }) => {
    let size = 20
    if (className?.includes("h-3")) size = 12
    else if (className?.includes("h-4")) size = 16
    else if (className?.includes("h-5")) size = 20
    else if (className?.includes("h-6")) size = 24
    return (
      <HugeiconsIcon
        icon={icon}
        className={className}
        size={size}
        strokeWidth={2}
        {...props}
      />
    )
  }
  IconWrapper.displayName = "IconWrapper"
  return IconWrapper
}

const Heading1 = createHugeIcon(Heading01Icon)
const Heading2 = createHugeIcon(Heading02Icon)
const Heading3 = createHugeIcon(Heading03Icon)
const List = createHugeIcon(LeftToRightListBulletIcon)
const ListOrdered = createHugeIcon(LeftToRightListNumberIcon)
const CheckSquare = createHugeIcon(CheckmarkSquare01Icon)
const Quote = createHugeIcon(QuoteUpIcon)
const Code = createHugeIcon(CodeIcon)
const TableIcon = createHugeIcon(HugeiconsTableIcon)

// --- Tiptap Core Extensions from Simple Editor ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"

// --- Lib and Utils ---
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { DocVersion, ProjectDoc } from "../hooks/useDocs"
import { resolveAvatarUrl } from "./DocsEditorUtils"

// --- Sub-components ---
import { CollaboratorsPresenceOverlay } from "./CollaboratorsPresenceOverlay"

interface DocsEditorCanvasProps {
  yDoc: Y.Doc | null
  provider: WebsocketProvider | null
  previewVersion: DocVersion | null
  userId: string
  userName: string
  userEmail?: string
  userAvatar: string | null
  userColor: string
  readOnly?: boolean
  doc?: ProjectDoc
  isSynced: boolean
  isOfflineMode: boolean
  setEditor: (editor: Editor | null) => void
  uploadImage: (file: File) => Promise<string>
  updateDoc: (params: {
    id: string
    data: Partial<ProjectDoc>
  }) => Promise<ProjectDoc>
  docId: string
}

export function DocsEditorCanvas({
  yDoc,
  provider,
  previewVersion,
  userId,
  userName,
  userEmail,
  userAvatar,
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

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          undoRedo: false,
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
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
                        id: userId,
                        name: userName,
                        email: userEmail,
                        avatar: resolveAvatarUrl(userAvatar),
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
          class:
            "simple-editor prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[400px] px-8 py-6",
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || [])
          const imageItem = items.find((item) => item.type.startsWith("image"))

          if (imageItem) {
            const file = imageItem.getAsFile()
            if (file) {
              event.preventDefault()
              const editor = (view.dom as unknown as { editor?: Editor }).editor

              uploadImage(file)
                .then((url) => {
                  if (url && editor && !editor.isDestroyed) {
                    editor.commands.setImage({
                      src: url,
                      alt: file.name.replace(/\.[^/.]+$/, "") || "pasted-image",
                    })
                  }
                })
                .catch((err) => {
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
            const editor = (view.dom as unknown as { editor?: Editor }).editor

            uploadImage(imageFile)
              .then((url) => {
                if (url && editor && !editor.isDestroyed) {
                  editor.commands.setImage({
                    src: url,
                    alt:
                      imageFile.name.replace(/\.[^/.]+$/, "") ||
                      "dropped-image",
                  })
                }
              })
              .catch((err) => {
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
    },
    [yDoc, provider, previewVersion]
  )

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
        shouldShow={({ editor }: { editor: Editor }) =>
          editor.isActive("table")
        }
      >
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {/* Row Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            tooltip="Insert Row Above"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon icon={ChevronUpIcon} size={16} strokeWidth={2} />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            tooltip="Insert Row Below"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon icon={ChevronDownIcon} size={16} strokeWidth={2} />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            tooltip="Delete Row"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
          </TiptapButton>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Column Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            tooltip="Insert Column Left"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} size={16} strokeWidth={2} />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            tooltip="Insert Column Right"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon icon={ChevronRightIcon} size={16} strokeWidth={2} />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            tooltip="Delete Column"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={16}
              strokeWidth={2}
              className="rotate-90"
            />
          </TiptapButton>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Cell Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!editor.can().mergeCells()}
            tooltip="Merge Cells"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon
              icon={PathfinderMergeIcon}
              size={16}
              strokeWidth={2}
            />
          </TiptapButton>
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!editor.can().splitCell()}
            tooltip="Split Cell"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <HugeiconsIcon icon={SplitIcon} size={16} strokeWidth={2} />
          </TiptapButton>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Table Actions */}
          <TiptapButton
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            tooltip="Delete Table"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
          </TiptapButton>
        </div>
      </BubbleMenu>

      <div className="simple-editor-content">
        <EditorContent editor={editor} />
      </div>

      <CollaboratorsPresenceOverlay provider={provider} userName={userName} />
    </EditorContext.Provider>
  )
}
