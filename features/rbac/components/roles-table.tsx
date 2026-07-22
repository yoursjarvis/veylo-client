"use client"

import { EmptyState } from "@/components/empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/hooks/use-permissions"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Delete01Icon,
  Edit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  AlertTriangle,
  GripVertical,
  MoreHorizontal,
  Search,
  ShieldAlert,
} from "lucide-react"
import { useQueryState } from "nuqs"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  useDeleteRole,
  useOrganizationRoles,
  useUpdateRoleHierarchy,
} from "../hooks/use-rbac"
import type { Role } from "../services/rbac.service"
import { RoleModal } from "./role-modal/role-modal"
import { RoleUsersAvatarStack } from "./role-users-avatar-stack"

import * as React from "react"

import { motion } from "framer-motion"

interface SortableContextType {
  attributes: ReturnType<typeof useSortable>["attributes"]
  listeners: ReturnType<typeof useSortable>["listeners"]
}
const SortableContextValue = React.createContext<SortableContextType | null>(
  null
)

const SortableRow = React.forwardRef<
  HTMLTableRowElement,
  Omit<
    React.HTMLAttributes<HTMLTableRowElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
  > & { id: string }
>(({ children, id, className, ...props }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  })

  const combinedRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      setNodeRef(node)
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [setNodeRef, ref]
  )

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 0,
    position: isDragging ? ("relative" as const) : undefined,
    backgroundColor: isDragging ? "hsl(var(--muted))" : undefined,
    boxShadow: isDragging
      ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
      : undefined,
  }

  return (
    <SortableContextValue.Provider value={{ attributes, listeners }}>
      <motion.tr
        layout={!isDragging}
        initial={false}
        transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
        ref={combinedRef}
        style={style}
        className={className}
        {...props}
      >
        {children}
      </motion.tr>
    </SortableContextValue.Provider>
  )
})
SortableRow.displayName = "SortableRow"

interface RolesTableProps {
  organizationId: string
}

const DragHandleCell = () => {
  const context = React.useContext(SortableContextValue)
  if (!context?.attributes) return null
  return (
    <button
      className="cursor-grab text-muted-foreground transition-colors outline-none hover:text-foreground"
      {...context.attributes}
      {...context.listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}

export function RolesTable({ organizationId }: RolesTableProps) {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  })

  const [localSearch, setLocalSearch] = useState(searchQuery || "")

  useEffect(() => {
    setLocalSearch(searchQuery || "")
  }, [searchQuery])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch || null)
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [localSearch, searchQuery, setSearchQuery])
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useOrganizationRoles(organizationId, searchQuery || undefined)
  const deleteRole = useDeleteRole(organizationId)
  const { hasPermission } = usePermissions()

  const canCreateRole = hasPermission("role:create")
  const canUpdateRole = hasPermission("role:update")
  const canDeleteRole = hasPermission("role:delete")
  const canUpdateHierarchy = hasPermission("role:update-hierarchy")
  const updateHierarchy = useUpdateRoleHierarchy(organizationId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const roles = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const [orderedRoles, setOrderedRoles] = useState<Role[]>([])

  useEffect(() => {
    setOrderedRoles(roles)
  }, [roles])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = orderedRoles.findIndex((r) => r.id === active.id)
      const newIndex = orderedRoles.findIndex((r) => r.id === over.id)

      const newRoles = arrayMove(orderedRoles, oldIndex, newIndex)
      setOrderedRoles(newRoles)

      try {
        await updateHierarchy.mutateAsync(newRoles.map((r) => r.id))
        toast.success("Role hierarchy updated")
      } catch (err: unknown) {
        setOrderedRoles(roles)
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(
          error.response?.data?.message || "Failed to update hierarchy"
        )
      }
    }
  }

  const handleDelete = async () => {
    if (!roleToDelete) return
    try {
      await deleteRole.mutateAsync(roleToDelete.id)
      toast.success("Role deleted successfully")
      setRoleToDelete(null)
    } catch {
      toast.error("Failed to delete role")
    }
  }

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        id: "drag",
        header: "",
        cell: DragHandleCell,
      },
      {
        accessorKey: "name",
        header: "Role Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
          const count = row.original.permissions?.length || 0
          return (
            <span className="text-sm text-muted-foreground">
              {count > 0 ? `${count} permissions` : "No permissions"}
            </span>
          )
        },
      },
      {
        id: "users",
        header: "Users",
        cell: ({ row }) => (
          <RoleUsersAvatarStack
            users={row.original.users || []}
            totalCount={row.original.userCount || 0}
          />
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const role = row.original
          const isOwner = role.name.toLowerCase() === "owner"
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isOwner || canUpdateRole) && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRole(role.id)
                        setIsModalOpen(true)
                      }}
                      className="cursor-pointer"
                    >
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        className="mr-2 h-4 w-4"
                      />
                      {isOwner || !canUpdateRole ? "View" : "Edit"}
                    </DropdownMenuItem>
                  )}
                  {!isOwner && canDeleteRole && (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() =>
                        setRoleToDelete({ id: role.id, name: role.name })
                      }
                    >
                      <HugeiconsIcon
                        icon={Delete01Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [canUpdateRole, canDeleteRole]
  )

  const table = useReactTable({
    data: orderedRoles,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const tableContainerRef = useRef<HTMLDivElement>(null)

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        if (scrollHeight - scrollTop - clientHeight < 300) {
          if (!isFetchingNextPage && hasNextPage) {
            fetchNextPage()
          }
        }
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current)
  }, [fetchMoreOnBottomReached])

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? orderedRoles.length + 1 : orderedRoles.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">
          Organization Roles
        </h2>
        <div className="ml-auto flex w-full max-w-sm items-center gap-3">
          <div className="relative w-full">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          {canCreateRole && (
            <Button
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => {
                setSelectedRole(null)
                setIsModalOpen(true)
              }}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border p-0 shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="h-8 w-8 text-muted-foreground" />}
            title="No roles found"
            description={
              searchQuery
                ? "No roles match your search criteria."
                : "Get started by creating a new role for your organization."
            }
            action={
              !searchQuery && canCreateRole ? (
                <Button onClick={() => setIsModalOpen(true)} className="mt-2">
                  <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              ) : undefined
            }
          />
        ) : (
          <CardContent className="p-0">
            <div
              ref={tableContainerRef}
              onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
              className="relative h-150 overflow-auto"
            >
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 py-3 font-medium text-muted-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedRoles.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {rowVirtualizer.getVirtualItems().length > 0 && (
                        <TableRow>
                          <TableCell
                            style={{
                              height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`,
                            }}
                            className="border-0 p-0"
                            colSpan={columns.length}
                          />
                        </TableRow>
                      )}
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const isLoaderRow = virtualRow.index > roles.length - 1
                        const row = table.getRowModel().rows[virtualRow.index]

                        return isLoaderRow ||
                          !!searchQuery ||
                          !canUpdateHierarchy ? (
                          <TableRow
                            key={virtualRow.index}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className="group transition-colors hover:bg-muted/30"
                          >
                            {isLoaderRow ? (
                              <TableCell
                                colSpan={columns.length}
                                className="h-16 px-4 py-4"
                              >
                                <Skeleton className="h-6 w-full" />
                              </TableCell>
                            ) : row ? (
                              row.getVisibleCells().map((cell) => (
                                <TableCell
                                  key={cell.id}
                                  className="h-16 border-b px-4 py-4"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))
                            ) : null}
                          </TableRow>
                        ) : (
                          <SortableRow
                            id={row.original.id}
                            key={virtualRow.index}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className="group transition-colors hover:bg-muted/30"
                          >
                            {row
                              ? row.getVisibleCells().map((cell) => (
                                  <TableCell
                                    key={cell.id}
                                    className="h-16 border-b px-4 py-4"
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </TableCell>
                                ))
                              : null}
                          </SortableRow>
                        )
                      })}
                      {rowVirtualizer.getVirtualItems().length > 0 && (
                        <TableRow>
                          <TableCell
                            style={{
                              height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)}px`,
                            }}
                            className="border-0 p-0"
                            colSpan={columns.length}
                          />
                        </TableRow>
                      )}
                    </SortableContext>
                  </DndContext>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      <RoleModal
        organizationId={organizationId}
        roleId={selectedRole}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-112.5">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role{" "}
              <strong>{roleToDelete?.name}</strong>? This action cannot be
              undone and this role will be removed from all assigned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
