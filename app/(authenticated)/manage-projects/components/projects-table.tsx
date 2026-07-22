import { axiosInstance } from "@/lib/axios"
import { formatDateTime } from "@/lib/datetime-formatter"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Delete02Icon,
  DocumentValidationIcon,
  Edit02Icon,
  MoreHorizontalCircle01Icon,
  PlayIcon,
  Refresh04Icon,
  SortByDownIcon,
  SortByUpIcon,
  Sorting05Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Project, STATUS_OPTIONS } from "../types"
import { ProjectIcon } from "./project-icon"

interface ProjectsTableProps {
  projects: Project[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  canCreateProject: boolean
  canUpdateProject: boolean
  canDeleteProject: boolean
  canRestoreProject: boolean
  canForceDeleteProject: boolean
  selectedProjectIds: string[]
  onSelectProjectIds: (ids: string[]) => void
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
  onSort: (field: string) => void
  onEditClick: (project: Project) => void
  onMembersClick: (project: Project) => void
  onDeleteClick: (project: Project) => void
}

export function ProjectsTable({
  projects,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  canCreateProject,
  canUpdateProject,
  canDeleteProject,
  canRestoreProject,
  canForceDeleteProject,
  selectedProjectIds,
  onSelectProjectIds,
  searchQuery,
  sortBy,
  sortOrder,
  onSort,
  onEditClick,
  onMembersClick,
  onDeleteClick,
}: ProjectsTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // State to track project for force deletion
  const [projectToForceDelete, setProjectToForceDelete] = useState<
    string | null
  >(null)

  // State to track project for starting
  const [projectToStart, setProjectToStart] = useState<Project | null>(null)

  // Edit/Update Project status mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      id: string
      status?: string | null
      startDate?: string | null
      endDate?: string | null
    }) => {
      const res = await axiosInstance.patch(`/projects/${payload.id}`, payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project updated successfully")
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update project")
    },
  })

  // Restore Project mutation
  const restoreProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return axiosInstance.post(`/projects/${id}/restore`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project restored successfully")
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to restore project")
    },
  })

  // Force Delete Project mutation
  const forceDeleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return axiosInstance.delete(`/projects/${id}/force`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project permanently deleted")
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to permanently delete project"
      )
    },
  })

  // Table Columns Definition
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              projects.length > 0 &&
              projects.every((p) => selectedProjectIds.includes(p.id))
            }
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectProjectIds(projects.map((p) => p.id))
              } else {
                onSelectProjectIds([])
              }
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProjectIds.includes(row.original.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectProjectIds([...selectedProjectIds, row.original.id])
              } else {
                onSelectProjectIds(
                  selectedProjectIds.filter((id) => id !== row.original.id)
                )
              }
            }}
          />
        ),
        size: 40,
      },
      {
        id: "icon",
        header: "",
        cell: ({ row }) => <ProjectIcon icon={row.original.icon} />,
        size: 50,
      },
      {
        accessorKey: "title",
        header: () => {
          const isSorted = sortBy === "title"
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSort("title")}
              className="-ml-2 h-8 gap-1.5 px-2 font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted/50 hover:text-foreground"
            >
              Project Title
              {isSorted ? (
                sortOrder === "asc" ? (
                  <HugeiconsIcon icon={SortByUpIcon} className="h-3.5 w-3.5" />
                ) : (
                  <HugeiconsIcon
                    icon={SortByDownIcon}
                    className="h-3.5 w-3.5"
                  />
                )
              ) : (
                <HugeiconsIcon
                  icon={Sorting05Icon}
                  className="h-3.5 w-3.5 text-muted-foreground/30"
                />
              )}
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span
              className="cursor-pointer text-sm font-semibold text-foreground hover:text-primary"
              onClick={() =>
                router.push(
                  `/${row.original.workspaceSlug}/projects/${row.original.id}`
                )
              }
            >
              {row.original.title}
            </span>
            <span className="mt-0.5 text-2xs tracking-wider text-muted-foreground uppercase">
              {row.original.projectKey}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "workspaceName",
        header: "Workspace",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-xs font-medium"
          >
            {row.original.workspaceName}
          </Badge>
        ),
      },
      {
        id: "projectStatus",
        header: "Project Status",
        cell: ({ row }) => {
          const project = row.original
          const currentStatus =
            STATUS_OPTIONS.find((s) => s.value === project.status) ||
            STATUS_OPTIONS[0]

          if (!canUpdateProject) {
            return (
              <Badge
                variant="outline"
                className={`border px-2.5 py-0.5 text-xs font-semibold ${currentStatus.color}`}
              >
                {currentStatus.label}
              </Badge>
            )
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentStatus.color} transition-opacity hover:opacity-85`}
                  >
                    {currentStatus.label}
                  </button>
                }
              />
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((statusOpt) => (
                  <DropdownMenuItem
                    key={statusOpt.value}
                    onClick={() => {
                      const payload: {
                        id: string
                        status?: string | null
                        endDate?: string | null
                      } = {
                        id: project.id,
                        status: statusOpt.value,
                      }
                      if (statusOpt.value === "completed") {
                        payload.endDate = new Date().toISOString()
                      } else if (project.status === "completed") {
                        payload.endDate = null
                      }
                      updateProjectMutation.mutate(payload)
                    }}
                    className="text-xs"
                  >
                    {statusOpt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        id: "timeline",
        header: "Timeline",
        cell: ({ row }) => {
          const project = row.original
          const formatDate = (dateStr?: string | null) => {
            if (!dateStr) return null
            return formatDateTime(dateStr)
          }
          return (
            <div className="flex flex-col text-2xs">
              <span className="font-medium text-foreground">
                Start: {formatDate(project.startDate) || "Not Started"}
              </span>
              <span className="mt-0.5 text-muted-foreground">
                End:{" "}
                {formatDate(project.endDate) ||
                  (project.startDate ? "In Progress" : "—")}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Lifecycle",
        cell: ({ row }) =>
          row.original.deletedAt ? (
            <Badge
              variant="destructive"
              className="px-2 py-0.5 text-xs font-semibold"
            >
              Deleted
            </Badge>
          ) : (
            <Badge
              variant="default"
              className="px-2 py-0.5 text-xs font-semibold"
            >
              Active
            </Badge>
          ),
      },
      {
        id: "action",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const project = row.original
          const isDeleted = !!project.deletedAt

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-12 w-12">
                      <HugeiconsIcon
                        icon={MoreHorizontalCircle01Icon}
                        className="h-8 w-8 text-2xl"
                        size={18}
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-36">
                  {isDeleted ? (
                    <>
                      {canRestoreProject && (
                        <DropdownMenuItem
                          onClick={() =>
                            restoreProjectMutation.mutate(project.id)
                          }
                          disabled={restoreProjectMutation.isPending}
                          className="text-xs font-medium text-green-600 hover:bg-green-800!"
                        >
                          <HugeiconsIcon
                            icon={Refresh04Icon}
                            className="mr-2 h-3.5 w-3.5"
                          />
                          Restore
                        </DropdownMenuItem>
                      )}
                      {canForceDeleteProject && (
                        <DropdownMenuItem
                          onClick={() => {
                            setProjectToForceDelete(project.id)
                          }}
                          disabled={forceDeleteProjectMutation.isPending}
                          className="text-xs font-medium text-destructive focus:text-destructive"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="mr-2 h-3.5 w-3.5"
                          />
                          Force Delete
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      {!project.startDate &&
                        canCreateProject &&
                        canUpdateProject && (
                          <DropdownMenuItem
                            onClick={() => setProjectToStart(project)}
                            disabled={updateProjectMutation.isPending}
                            className="text-xs font-medium text-primary"
                          >
                            <HugeiconsIcon
                              icon={PlayIcon}
                              className="mr-2 h-3.5 w-3.5"
                              strokeWidth={2}
                            />
                            Start Project
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem
                        onClick={() => onMembersClick(project)}
                        className="text-xs font-medium"
                      >
                        <HugeiconsIcon
                          icon={UserAdd01Icon}
                          strokeWidth={2}
                          className="mr-2 h-3.5 w-3.5"
                        />
                        Members
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEditClick(project)}
                        className="text-xs font-medium"
                      >
                        <HugeiconsIcon
                          icon={Edit02Icon}
                          strokeWidth={2}
                          className="mr-2 h-3.5 w-3.5"
                        />
                        Edit
                      </DropdownMenuItem>
                      {canDeleteProject && (
                        <DropdownMenuItem
                          onClick={() => onDeleteClick(project)}
                          className="text-xs font-medium text-destructive focus:text-destructive"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            strokeWidth={2}
                            className="mr-2 h-3.5 w-3.5"
                          />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [
      router,
      restoreProjectMutation,
      forceDeleteProjectMutation,
      canCreateProject,
      canUpdateProject,
      canDeleteProject,
      canRestoreProject,
      canForceDeleteProject,
      updateProjectMutation,
      onEditClick,
      onMembersClick,
      onDeleteClick,
      selectedProjectIds,
      onSelectProjectIds,
      projects,
      sortBy,
      sortOrder,
      onSort,
    ]
  )

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 58,
    overscan: 10,
  })

  return (
    <>
      <Card className="overflow-hidden border border-border/50 pt-0 shadow-xs">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HugeiconsIcon
              icon={DocumentValidationIcon}
              className="mb-4 h-12 w-12 text-muted-foreground"
            />
            <h3 className="text-lg font-semibold text-foreground">
              No Projects Found
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {searchQuery
                ? "No projects matches your search query."
                : "No projects match the selected filters."}
            </p>
          </div>
        ) : (
          <CardContent className="p-0">
            <div
              ref={tableContainerRef}
              className="relative h-137.5 overflow-auto"
              onScroll={(e) => {
                const target = e.currentTarget
                if (
                  target.scrollHeight - target.scrollTop <=
                    target.clientHeight + 100 &&
                  hasNextPage &&
                  !isFetchingNextPage
                ) {
                  fetchNextPage()
                }
              }}
            >
              <Table className="w-full border-collapse text-left">
                <TableHeader className="sticky top-0 z-20 border-b border-border/50 bg-muted/65 backdrop-blur-md">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="border-b hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: header.column.columnDef.size }}
                          className="px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
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
                <TableBody className="divide-y divide-border/40">
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <TableRow className="border-0 hover:bg-transparent">
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
                    const row = table.getRowModel().rows[virtualRow.index]
                    if (!row) return null

                    return (
                      <TableRow
                        key={virtualRow.index}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="border-b transition-colors hover:bg-muted/10"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="h-14.5 px-4 py-3 align-middle text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell
                        style={{
                          height: `${
                            rowVirtualizer.getTotalSize() -
                            (rowVirtualizer.getVirtualItems()[
                              rowVirtualizer.getVirtualItems().length - 1
                            ]?.end || 0)
                          }px`,
                        }}
                        className="border-0 p-0"
                        colSpan={columns.length}
                      />
                    </TableRow>
                  )}
                  {isFetchingNextPage && (
                    <>
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow
                          key={`skeleton-${idx}`}
                          className="border-t border-border/40 transition-colors hover:bg-muted/5"
                        >
                          {columns.map((col, colIdx) => (
                            <TableCell
                              key={`skeleton-${idx}-${colIdx}`}
                              className="h-14.5 px-4 py-3 align-middle"
                              style={{ width: col.size }}
                            >
                              <Skeleton className="h-4 w-full bg-muted/20" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog
        open={!!projectToForceDelete}
        onOpenChange={(open) => {
          if (!open) setProjectToForceDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this project? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (projectToForceDelete) {
                  forceDeleteProjectMutation.mutate(projectToForceDelete)
                  setProjectToForceDelete(null)
                }
              }}
              className="bg-destructive font-semibold hover:bg-destructive/95"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!projectToStart}
        onOpenChange={(open) => {
          if (!open) setProjectToStart(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start the project &quot;
              {projectToStart?.title}&quot;? This will set its start date to
              today and status to on track.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (projectToStart) {
                  updateProjectMutation.mutate({
                    id: projectToStart.id,
                    startDate: new Date().toISOString(),
                    status: "on_track",
                  })
                  setProjectToStart(null)
                }
              }}
              className="bg-primary font-semibold text-primary-foreground hover:bg-primary/95"
            >
              Start Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
