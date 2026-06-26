"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer, Extension, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Suggestion from "@tiptap/suggestion";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";

const lowlight = createLowlight(all);

// Debounce helper to prevent heavy state updates on every keystroke
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = function(this: any, ...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  return debounced;
}

function CodeBlockComponent({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}: any) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const languages = ["auto", ...extension.options.lowlight.listLanguages()];
  
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered = languages.filter((lang: string) => 
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayValue = defaultLanguage || "auto";

  return (
    <NodeViewWrapper className="code-block relative group/code my-3">
      <div
        ref={containerRef}
        className="absolute right-2 top-2 z-20 opacity-0 group-hover/code:opacity-100 focus-within:opacity-100 transition-opacity inline-block text-left"
        contentEditable={false}
        data-combobox-container="true"
      >
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setSearchQuery("");
          }}
          className="flex h-7 items-center justify-between gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer select-none"
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
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Dropdown Panel */}
        {open && (
          <div className="absolute right-0 mt-1 z-50 w-44 rounded-md border border-border bg-background p-1.5 shadow-lg max-h-56 flex flex-col">
            {/* Search Input */}
            <div className="relative mb-1.5">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
              />
            </div>

            {/* Options List */}
            <div className="overflow-y-auto space-y-0.5 max-h-40 pr-0.5">
              {filtered.length === 0 ? (
                <div className="px-2 py-1.5 text-center text-xs text-muted-foreground/80">
                  No results found
                </div>
              ) : (
                filtered.map((lang: string) => {
                  const isSelected = (defaultLanguage === "" && lang === "auto") || defaultLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        updateAttributes({ language: lang === "auto" ? "" : lang });
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-all hover:bg-muted hover:text-foreground ${
                        isSelected ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
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
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      <pre className="font-mono text-sm leading-relaxed overflow-x-auto border border-border bg-muted/20 rounded-lg">
        <code className={defaultLanguage ? `language-${defaultLanguage}` : ""}>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
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
import { Tooltip } from "@/components/ui/tooltip-card";
import { mergeAttributes } from "@tiptap/core";

function SafeAvatar({ src, name, size }: { src?: string | null, name: string, size: number }) {
  const [hasError, setHasError] = React.useState(false);
  const initials = name?.charAt(0).toUpperCase() || "?";
  
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <span 
        className="relative flex shrink-0 overflow-hidden rounded-full border border-border" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img 
          src={src} 
          alt={name} 
          onError={() => setHasError(true)} 
          className="aspect-square object-cover"
          style={{ 
            width: '100%', 
            height: '100%', 
            minWidth: '100%', 
            minHeight: '100%',
            margin: 0,
            padding: 0,
            borderRadius: '9999px',
            border: 'none',
            display: 'block'
          }}
        />
      </span>
    );
  }

  const fontSize = size > 20 ? "text-sm font-semibold" : "text-[8px] font-bold leading-none";
  return (
    <span 
      className={`relative flex shrink-0 overflow-hidden rounded-full border border-border bg-muted text-foreground items-center justify-center leading-none ${fontSize}`} 
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {initials}
    </span>
  );
}

function MentionNodeView({ node, editor }: any) {
  const { id, label } = node.attrs;

  // Retrieve projectMembers from editor storage
  const members = (editor?.storage as any)?.mention?.projectMembers || [];
  const member = members.find((m: any) => m.user?.id === id);

  const avatar = member?.user?.image || node.attrs.avatar;
  const email = member?.user?.email || node.attrs.email;
  const displayName = member?.user?.name || label || "Unknown User";

  const tooltipContent = (
    <div className="flex items-start gap-3 text-left">
      <SafeAvatar src={avatar} name={displayName} size={40} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate leading-none mb-1">
          {displayName}
        </div>
        {email && (
          <div className="text-xs text-muted-foreground truncate font-normal">
            {email}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <NodeViewWrapper as="span" className="inline-block select-all" style={{ verticalAlign: "middle" }}>
      <Tooltip content={tooltipContent} containerClassName="align-middle">
        <span className="inline-flex items-center gap-1 bg-accent text-accent-foreground border border-border pl-1 pr-1.5 py-0.5 rounded text-[11px] font-semibold select-none cursor-pointer max-w-[150px] align-middle">
          <SafeAvatar src={avatar} name={displayName} size={14} />
          <span className="truncate max-w-[110px]">{displayName}</span>
        </span>
      </Tooltip>
    </NodeViewWrapper>
  );
}

const CustomMention = Mention.extend({
  addStorage() {
    return {
      projectMembers: [],
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) return {};
          return { 'data-label': attributes.label };
        },
      },
      avatar: {
        default: null,
        parseHTML: element => element.getAttribute('data-avatar'),
        renderHTML: attributes => {
          if (!attributes.avatar) return {};
          return { 'data-avatar': attributes.avatar };
        },
      },
      email: {
        default: null,
        parseHTML: element => element.getAttribute('data-email'),
        renderHTML: attributes => {
          if (!attributes.email) return {};
          return { 'data-email': attributes.email };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
      {
        tag: 'span.mention',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
      `${this.options.suggestion.char}${node.attrs.label || node.attrs.id}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
});

// Custom slash command extension
const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: LooseAny; range: LooseAny; props: { command: (editor: LooseAny, range: LooseAny) => void } }) => {
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
  projectMembers?: { user: { id: string; name?: string; image?: string | null } }[];
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
  const lastEmittedValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedOnChange = useRef(
    debounce((html: string) => {
      onChangeRef.current(html);
    }, 150)
  ).current;

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // Helper: upload image and insert in editor
  const uploadAndInsertImage = async (file: File, view: LooseAny) => {
    const formData = new FormData();
    formData.append("file", file);

    const promise = axiosInstance.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.promise(promise, {
      loading: "Uploading image...",
      success: (response: { data: { data: { url: string } } }) => {
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
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
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
            return projectMembers
              .filter((m) => m.user.name?.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: LooseAny;
            let popup: TippyInstance[];

            return {
              onStart: (props: LooseRecord) => {
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

              onUpdate(props: LooseRecord) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) || false;
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
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
                },
              },
              {
                title: "Heading 2",
                description: "Medium section heading",
                icon: Heading2,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
                },
              },
              {
                title: "Heading 3",
                description: "Small section heading",
                icon: Heading3,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
                },
              },
              {
                title: "Bullet List",
                description: "Create a simple bulleted list",
                icon: List,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).toggleBulletList().run();
                },
              },
              {
                title: "Numbered List",
                description: "Create a list with numbering",
                icon: ListOrdered,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
              },
              {
                title: "Blockquote",
                description: "Insert a quote block",
                icon: Quote,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
              },
              {
                title: "Code Block",
                description: "Insert a code block",
                icon: Code,
                command: (ed: LooseAny, range: LooseAny) => {
                  ed.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
              },
            ];

            return items
              .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: LooseAny;
            let popup: TippyInstance[];

            return {
              onStart: (props: LooseRecord) => {
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

              onUpdate(props: LooseRecord) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) || false;
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
      const html = ed.getHTML();
      lastEmittedValueRef.current = html;
      debouncedOnChange(html);
    },
    onBlur: () => {
      debouncedOnChange.cancel();
      if (editor) {
        onChange(editor.getHTML());
      }
      onBlur?.();
    },
    editorProps: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (event.target instanceof HTMLElement && event.target.closest('[data-combobox-container]')) {
            return true;
          }
          return false;
        },
        pointerdown: (view, event) => {
          if (event.target instanceof HTMLElement && event.target.closest('[data-combobox-container]')) {
            return true;
          }
          return false;
        },
        click: (view, event) => {
          if (event.target instanceof HTMLElement && event.target.closest('[data-combobox-container]')) {
            return true;
          }
          return false;
        },
        keydown: (view, event) => {
          if (event.target instanceof HTMLElement && event.target.closest('[data-combobox-container]')) {
            return true;
          }
          return false;
        },
        keyup: (view, event) => {
          if (event.target instanceof HTMLElement && event.target.closest('[data-combobox-container]')) {
            return true;
          }
          return false;
        },
      },
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

  // Sync projectMembers to CustomMention storage and force NodeViews to re-render
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      (editor.storage as any).mention.projectMembers = projectMembers;
      editor.view.dispatch(editor.view.state.tr);
    }
  }, [editor, projectMembers]);

  // Sync content from outside (e.g. when comments clear or description changes externally)
  useEffect(() => {
    if (!editor) return;

    if (value === lastEmittedValueRef.current) return;

    const currentHTML = editor.getHTML();
    // Standard clean checks
    const valNormalized = value === "" || value === "<p></p>" ? "" : value;
    const currentNormalized = currentHTML === "" || currentHTML === "<p></p>" ? "" : currentHTML;

    if (valNormalized !== currentNormalized) {
      const timeoutId = setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(value);
          lastEmittedValueRef.current = value;
        }
      }, 0);
      return () => clearTimeout(timeoutId);
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
