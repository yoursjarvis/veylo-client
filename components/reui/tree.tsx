"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { ItemInstance, TreeInstance } from "@headless-tree/core"
import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"
import {
  ArrowDown01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type ToggleIconType = "chevron" | "plus-minus"

interface TreeContextValue<T = unknown> {
  indent: number
  currentItem?: ItemInstance<T>
  tree?: TreeInstance<T>
  toggleIconType?: ToggleIconType
}

const TreeContext = createContext<TreeContextValue<unknown>>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
  toggleIconType: "plus-minus",
})

function useTreeContext<T = unknown>() {
  return useContext(TreeContext) as TreeContextValue<T>
}

interface TreeProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number
  tree?: TreeInstance<T>
  toggleIconType?: ToggleIconType
}

function Tree<T = unknown>({
  indent = 20,
  tree,
  className,
  toggleIconType = "chevron",
  ...props
}: TreeProps<T>) {
  const containerProps =
    tree && typeof tree.getContainerProps === "function"
      ? tree.getContainerProps()
      : {}
  const mergedProps = { ...props, ...containerProps }

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  } as React.CSSProperties

  return (
    <TreeContext.Provider
      value={{
        indent,
        tree: tree as unknown as TreeInstance<unknown>,
        toggleIconType,
      }}
    >
      <div
        data-slot="tree"
        style={mergedStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  )
}

interface TreeItemProps<T = unknown> extends Omit<
  useRender.ComponentProps<"button">,
  "indent"
> {
  item: ItemInstance<T>
  indent?: number
}

function TreeItem<T = unknown>({
  item,
  className,
  render,
  children,
  ...props
}: TreeItemProps<T>) {
  const parentContext = useTreeContext<T>()
  const { indent } = parentContext

  const itemProps = typeof item.getProps === "function" ? item.getProps() : {}
  const mergedProps = { ...props, children, ...itemProps }

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  } as React.CSSProperties

  const defaultProps = {
    "data-slot": "tree-item",
    style: mergedStyle,
    className: cn(
      "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    "data-focus":
      typeof item.isFocused === "function"
        ? item.isFocused() || false
        : undefined,
    "data-folder":
      typeof item.isFolder === "function"
        ? item.isFolder() || false
        : undefined,
    "data-selected":
      typeof item.isSelected === "function"
        ? item.isSelected() || false
        : undefined,
    "data-drag-target":
      typeof item.isDragTarget === "function"
        ? item.isDragTarget() || false
        : undefined,
    "data-search-match":
      typeof item.isMatchingSearch === "function"
        ? item.isMatchingSearch() || false
        : undefined,
    "aria-expanded": item.isExpanded(),
  }

  return (
    <TreeContext.Provider
      value={{
        ...parentContext,
        currentItem: item as unknown as ItemInstance<unknown>,
        tree: parentContext.tree as unknown as TreeInstance<unknown>,
      }}
    >
      {useRender({
        defaultTagName: "button",
        render,
        props: mergeProps<"button">(defaultProps, otherProps),
      })}
    </TreeContext.Provider>
  )
}

interface TreeItemLabelProps<
  T = unknown,
> extends React.HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>
}

function TreeItemLabel<T = unknown>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem, toggleIconType } = useTreeContext<T>()
  const item = propItem || currentItem

  if (!item) {
    console.warn("TreeItemLabel: No item provided via props or context")
    return null
  }

  return (
    <span
      data-slot="tree-item-label"
      className={cn(
        "flex items-center gap-1 bg-background transition-colors not-in-data-[folder=true]:ps-7 hover:bg-accent in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50 in-data-[drag-target=true]:bg-accent in-data-[search-match=true]:bg-blue-50! in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "rounded-md",
        "py-1.5",
        "px-2",
        "text-sm",
        className
      )}
      {...props}
    >
      {item.isFolder() && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (item.isExpanded()) {
              item.collapse()
            } else {
              item.expand()
            }
          }}
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent"
        >
          {toggleIconType === "plus-minus" ? (
            item.isExpanded() ? (
              <HugeiconsIcon
                icon={MinusSignIcon}
                className="size-3"
                stroke="currentColor"
                strokeWidth={2}
              />
            ) : (
              <HugeiconsIcon
                icon={PlusSignIcon}
                className="size-3"
                stroke="currentColor"
                strokeWidth={2}
              />
            )
          ) : (
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-3.5 transition-transform in-aria-[expanded=false]:-rotate-90"
            />
          )}
        </span>
      )}
      {children ||
        (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  )
}

function TreeDragLine({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext()

  if (!tree || typeof tree.getDragLineStyle !== "function") {
    console.warn(
      "TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method"
    )
    return null
  }

  const dragLine = tree.getDragLineStyle()
  return (
    <div
      style={dragLine}
      className={cn(
        "absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:border-2 before:border-primary before:bg-background",
        "before:rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel }
