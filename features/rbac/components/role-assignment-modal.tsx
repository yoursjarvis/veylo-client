"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { axiosInstance } from "@/lib/axios"
import { cn } from "@/lib/utils"
import {
  ArrowDown01Icon,
  Delete02Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useAssignRole,
  useOrganizationRoles,
  useUserAssignments,
} from "../hooks/use-rbac"

interface RoleAssignmentModalProps {
  userId: string
  userName: string
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AssignmentRow = {
  id: string
  roleId: string
  scopeType: "ORGANIZATION" | "PROJECT" | "WORKSPACE"
  scopeId: string
}

export function RoleAssignmentModal({
  userId,
  userName,
  organizationId,
  open,
  onOpenChange,
}: RoleAssignmentModalProps) {
  const { data } = useOrganizationRoles(organizationId)
  const roles = data?.pages.flatMap((page) => page.data) ?? []
  const { mutateAsync: assignRole, isPending } = useAssignRole()

  // Fetch ALL assignments for the user by not passing scopeType and scopeId
  const { data: userAssignments, isFetching: isFetchingAssignments } =
    useUserAssignments(userId)

  const [rows, setRows] = useState<AssignmentRow[]>([])

  useEffect(() => {
    if (userAssignments && open) {
      setTimeout(() => {
        if (userAssignments.length === 0) {
          setRows([
            {
              id: Math.random().toString(36),
              roleId: "",
              scopeType: "ORGANIZATION",
              scopeId: organizationId,
            },
          ])
        } else {
          setRows(
            userAssignments.map(
              (a: {
                id?: string
                roleId: string
                scopeType: string
                scopeId: string
              }) => ({
                id: a.id || Math.random().toString(36),
                roleId: a.roleId,
                scopeType: a.scopeType as
                  "ORGANIZATION" | "PROJECT" | "WORKSPACE",
                scopeId: a.scopeId,
              })
            )
          )
        }
      }, 0)
    } else if (!open) {
      setTimeout(() => {
        setRows([])
      }, 0)
    }
  }, [userAssignments, organizationId, open])

  // Fetch projects unconditionally because any row could switch to PROJECT
  const { data: projects } = useQuery({
    queryKey: ["projects", organizationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/organizations/${organizationId}/projects`
      )
      return data.data
    },
    enabled: open,
  })

  // Fetch workspaces unconditionally because any row could switch to WORKSPACE
  const { data: workspaces } = useQuery({
    queryKey: ["workspaces", organizationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/organizations/${organizationId}/workspaces`
      )
      return data.data
    },
    enabled: open,
  })

  const handleAssign = async () => {
    try {
      // Group current rows by scope
      const currentScopes = new Map<
        string,
        { scopeType: string; scopeId: string; roleIds: string[] }
      >()
      for (const row of rows) {
        if (!row.roleId) continue
        if (!row.scopeId && row.scopeType !== "ORGANIZATION") continue
        const key = `${row.scopeType}-${row.scopeId}`
        if (!currentScopes.has(key)) {
          currentScopes.set(key, {
            scopeType: row.scopeType,
            scopeId: row.scopeId,
            roleIds: [],
          })
        }
        const scope = currentScopes.get(key)!
        if (!scope.roleIds.includes(row.roleId)) {
          scope.roleIds.push(row.roleId)
        }
      }

      // Find previous scopes from `userAssignments`
      const previousScopes = new Set<string>()
      if (userAssignments) {
        for (const a of userAssignments) {
          previousScopes.add(`${a.scopeType}-${a.scopeId}`)
        }
      }

      // Add previous scopes with empty roles if they are not in currentScopes (i.e. all roles removed)
      for (const key of previousScopes) {
        if (!currentScopes.has(key)) {
          const [scopeType, scopeId] = key.split("-")
          currentScopes.set(key, { scopeType, scopeId, roleIds: [] })
        }
      }

      const promises = Array.from(currentScopes.values()).map((scope) =>
        assignRole({
          userId,
          roleIds: scope.roleIds,
          scopeType: scope.scopeType as
            "ORGANIZATION" | "PROJECT" | "WORKSPACE",
          scopeId: scope.scopeId,
        })
      )

      await Promise.all(promises)
      toast.success("Roles updated successfully")
      onOpenChange(false)
    } catch {
      toast.error("Failed to update roles")
    }
  }

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Math.random().toString(36),
        roleId: "",
        scopeType: "ORGANIZATION",
        scopeId: organizationId,
      },
    ])
  }

  const removeRow = (id: string) => {
    const newRows = rows.filter((r) => r.id !== id)
    if (newRows.length === 0) {
      newRows.push({
        id: Math.random().toString(36),
        roleId: "",
        scopeType: "ORGANIZATION",
        scopeId: organizationId,
      })
    }
    setRows(newRows)
  }

  const updateRow = (id: string, updates: Partial<AssignmentRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-6xl min-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Roles to {userName}</DialogTitle>
          <DialogDescription>
            Specify the roles and the scope within which this user will have
            these permissions.
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          <div className="space-y-4 py-4">
            <div className="mb-2 flex items-center gap-3 px-1">
              <Label className="flex-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Role
              </Label>
              <Label className="flex-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Scope
              </Label>
              <Label className="flex-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Project/Workspace
              </Label>
              <div className="w-[80px]"></div>
            </div>

            <div className="overflow-hidden rounded-md border border-border/50">
              {rows.map((row, index) => (
                <AssignmentRowItem
                  key={row.id}
                  row={row}
                  isLast={index === rows.length - 1}
                  roles={roles || []}
                  projects={projects || []}
                  workspaces={workspaces || []}
                  organizationId={organizationId}
                  updateRow={updateRow}
                  removeRow={removeRow}
                  addRow={addRow}
                />
              ))}
            </div>
          </div>
        </TooltipProvider>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isPending || isFetchingAssignments}
          >
            {isPending ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignmentRowItem({
  row,
  isLast,
  roles,
  projects,
  workspaces,
  organizationId,
  updateRow,
  removeRow,
  addRow,
}: {
  row: AssignmentRow
  isLast: boolean
  roles: { id: string; name: string }[]
  projects: { id: string; name?: string; title?: string }[]
  workspaces: { id: string; name?: string; title?: string }[]
  organizationId: string
  updateRow: (id: string, updates: Partial<AssignmentRow>) => void
  removeRow: (id: string) => void
  addRow: () => void
}) {
  const [roleOpen, setRoleOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  return (
    <div className="group flex w-full animate-in items-center gap-3 border-b border-border/50 py-2 duration-200 fade-in zoom-in last:border-b-0">
      <div className="min-w-0 flex-1">
        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={roleOpen}
                className="h-8 w-full justify-between border-border/50 bg-background text-xs font-normal transition-colors hover:bg-muted/50"
              >
                <span className="truncate">
                  {row.roleId
                    ? roles?.find((r) => r.id === row.roleId)?.name ||
                      "Select role..."
                    : "Select role..."}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className="ml-2 h-3 w-3 shrink-0 opacity-50"
                />
              </Button>
            }
          />
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search roles..." />
              <CommandList>
                <CommandEmpty>No roles found.</CommandEmpty>
                <CommandGroup>
                  {roles?.map((role) => (
                    <CommandItem
                      key={role.id}
                      value={role.name}
                      onSelect={() => {
                        updateRow(row.id, { roleId: role.id })
                        setRoleOpen(false)
                      }}
                      className="py-1.5 text-xs"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn(
                          "mr-2 h-3 w-3",
                          row.roleId === role.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {role.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-w-0 flex-1">
        <Popover open={scopeOpen} onOpenChange={setScopeOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={scopeOpen}
                className="h-8 w-full justify-between border-border/50 bg-background text-xs font-normal transition-colors hover:bg-muted/50"
              >
                <span className="truncate">
                  {row.scopeType === "ORGANIZATION" && "Organization Wide"}
                  {row.scopeType === "WORKSPACE" && "Specific Workspace"}
                  {row.scopeType === "PROJECT" && "Specific Project"}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className="ml-2 h-3 w-3 shrink-0 opacity-50"
                />
              </Button>
            }
          />
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search scope..." />
              <CommandList>
                <CommandEmpty>No scope found.</CommandEmpty>
                <CommandGroup>
                  {[
                    { value: "ORGANIZATION", label: "Organization Wide" },
                    { value: "WORKSPACE", label: "Specific Workspace" },
                    { value: "PROJECT", label: "Specific Project" },
                  ].map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={() => {
                        updateRow(row.id, {
                          scopeType: item.value as
                            "ORGANIZATION" | "PROJECT" | "WORKSPACE",
                          scopeId:
                            item.value === "ORGANIZATION" ? organizationId : "",
                        })
                        setScopeOpen(false)
                      }}
                      className="py-1.5 text-xs"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn(
                          "mr-2 h-3 w-3",
                          row.scopeType === item.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-w-0 flex-1">
        {row.scopeType === "PROJECT" && (
          <Popover open={projectOpen} onOpenChange={setProjectOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectOpen}
                  className="h-8 w-full justify-between border-border/50 bg-background text-xs font-normal transition-colors hover:bg-muted/50"
                >
                  <span className="truncate">
                    {row.scopeId && projects?.length
                      ? projects.find((p) => p.id === row.scopeId)?.title ||
                        projects.find((p) => p.id === row.scopeId)?.name ||
                        "Select project..."
                      : "Select project..."}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className="ml-2 h-3 w-3 shrink-0 opacity-50"
                  />
                </Button>
              }
            />
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search project..." />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    {projects?.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.title || project.name}
                        onSelect={() => {
                          updateRow(row.id, { scopeId: project.id })
                          setProjectOpen(false)
                        }}
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className={cn(
                            "mr-2 h-3 w-3",
                            row.scopeId === project.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {project.title || project.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {row.scopeType === "WORKSPACE" && (
          <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={workspaceOpen}
                  className="h-8 w-full justify-between border-border/50 bg-background text-xs font-normal transition-colors hover:bg-muted/50"
                >
                  <span className="truncate">
                    {row.scopeId && workspaces?.length
                      ? workspaces.find((w) => w.id === row.scopeId)?.title ||
                        workspaces.find((w) => w.id === row.scopeId)?.name ||
                        "Select workspace..."
                      : "Select workspace..."}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className="ml-2 h-3 w-3 shrink-0 opacity-50"
                  />
                </Button>
              }
            />
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search workspace..." />
                <CommandList>
                  <CommandEmpty>No workspaces found.</CommandEmpty>
                  <CommandGroup>
                    {workspaces?.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        value={workspace.title || workspace.name}
                        onSelect={() => {
                          updateRow(row.id, { scopeId: workspace.id })
                          setWorkspaceOpen(false)
                        }}
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className={cn(
                            "mr-2 h-3 w-3",
                            row.scopeId === workspace.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {workspace.title || workspace.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex w-[80px] items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3" />
              </Button>
            }
          />
          <TooltipContent>
            <p>Remove Assignment</p>
          </TooltipContent>
        </Tooltip>

        {isLast && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addRow}
                  className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="h-3 w-3" />
                </Button>
              }
            />
            <TooltipContent>
              <p>Add Assignment</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
