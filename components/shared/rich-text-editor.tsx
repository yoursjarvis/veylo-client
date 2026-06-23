"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Suggestion from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { MentionList } from "./mention-list";
import { SlashCommandList, CommandItem } from "./slash-command-list";
import { Button } from "@/components/ui/button";

// Custom slash command extension
const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command(editor, range);
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  projectMembers?: any[];
  className?: string;
  minHeight?: string;
  onSubmit?: () => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: upload image and insert in editor
  const uploadAndInsertImage = async (file: File, view: any) => {
    const formData = new FormData();
    formData.append("file", file);

    const promise = axiosInstance.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.promise(promise, {
      loading: "Uploading image...",
      success: (response: any) => {
        const url = response.data.data.url;
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: url });
        const transaction = view.state.tr.replaceSelectionWith(node);
        view.dispatch(transaction);
        return "Image uploaded successfully";
      },
      error: "Failed to upload image",
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
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
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          char: "@",
          items: ({ query }: { query: string }) => {
            return projectMembers
              .filter((m) => m.user.name?.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: any;
            let popup: TippyInstance[];

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
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
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
                },
              },
              {
                title: "Heading 2",
                description: "Medium section heading",
                icon: Heading2,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
                },
              },
              {
                title: "Heading 3",
                description: "Small section heading",
                icon: Heading3,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
                },
              },
              {
                title: "Bullet List",
                description: "Create a simple bulleted list",
                icon: List,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).toggleBulletList().run();
                },
              },
              {
                title: "Numbered List",
                description: "Create a list with numbering",
                icon: ListOrdered,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
              },
              {
                title: "Blockquote",
                description: "Insert a quote block",
                icon: Quote,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
              },
              {
                title: "Code Block",
                description: "Insert a code block",
                icon: Code,
                command: (ed, range) => {
                  ed.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
              },
            ];

            return items
              .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: any;
            let popup: TippyInstance[];

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          if (onSubmit) {
            event.preventDefault();
            onSubmit();
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            uploadAndInsertImage(file, view);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/")) {
            uploadAndInsertImage(file, view);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content from outside (e.g. when comments clear or description changes externally)
  useEffect(() => {
    if (!editor) return;

    const currentHTML = editor.getHTML();
    // Standard clean checks
    const valNormalized = value === "" || value === "<p></p>" ? "" : value;
    const currentNormalized = currentHTML === "" || currentHTML === "<p></p>" ? "" : currentHTML;

    if (valNormalized !== currentNormalized) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        style={{ minHeight }}
        className="w-full border border-border rounded-lg bg-background p-3 animate-pulse"
      />
    );
  }

  // Formatting helper triggers
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndInsertImage(e.target.files[0], editor.view);
    }
  };

  return (
    <div
      className={`flex flex-col w-full border border-border rounded-lg bg-background overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all duration-150 ${className}`}
    >
      {/* Editor Content Area */}
      <div className="flex-1 p-3 overflow-y-auto" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 py-1.5 z-10 select-none">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
              editor.isActive("strike") ? "bg-muted text-foreground" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
              editor.isActive("orderedList") ? "bg-muted text-foreground" : ""
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={addLink}
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className={`h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted ${
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
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
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

        <div className="text-[10px] text-muted-foreground/80 font-medium">
          Type <kbd className="px-1 py-0.5 rounded bg-muted/80 border border-border">@</kbd> to tag,{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted/80 border border-border">/</kbd> for blocks
        </div>
      </div>
    </div>
  );
}
