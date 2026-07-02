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
  scopeType: "ORGANIZATION" | "PROJECT" | "DEPARTMENT"
  scopeId: string
}

export function RoleAssignmentModal({
  userId,
  userName,
  organizationId,
  open,
  onOpenChange,
}: RoleAssignmentModalProps) {
  const { data: roles } = useOrganizationRoles(organizationId)
  const { mutateAsync: assignRole, isPending } = useAssignRole()

  // Fetch ALL assignments for the user by not passing scopeType and scopeId
  const { data: userAssignments, isFetching: isFetchingAssignments } =
    useUserAssignments(userId)

  const [rows, setRows] = useState<AssignmentRow[]>([])

  useEffect(() => {
    if (userAssignments && open) {
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
          userAssignments.map((a: any) => ({
            id: a.id || Math.random().toString(36),
            roleId: a.roleId,
            scopeType: a.scopeType as any,
            scopeId: a.scopeId,
          }))
        )
      }
    } else if (!open) {
      setRows([])
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
          scopeType: scope.scopeType as any,
          scopeId: scope.scopeId,
        } as any)
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
              <Label className="flex-1">Role</Label>
              <Label className="flex-1">Scope</Label>
              <Label className="flex-1">Project/Department</Label>
              <div className="w-[80px]"></div>
            </div>

            {rows.map((row, index) => (
              <AssignmentRowItem
                key={row.id}
                row={row}
                index={index}
                isLast={index === rows.length - 1}
                roles={roles || []}
                projects={projects || []}
                organizationId={organizationId}
                updateRow={updateRow}
                removeRow={removeRow}
                addRow={addRow}
              />
            ))}
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
  index,
  isLast,
  roles,
  projects,
  organizationId,
  updateRow,
  removeRow,
  addRow,
}: {
  row: AssignmentRow
  index: number
  isLast: boolean
  roles: any[]
  projects: any[]
  organizationId: string
  updateRow: (id: string, updates: Partial<AssignmentRow>) => void
  removeRow: (id: string) => void
  addRow: () => void
}) {
  const [roleOpen, setRoleOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)

  return (
    <div className="flex w-full animate-in items-center gap-3 duration-200 fade-in zoom-in">
      <div className="min-w-0 flex-1">
        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
          <PopoverTrigger render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={roleOpen}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {row.roleId
                  ? roles?.find((r) => r.id === row.roleId)?.name ||
                    "Select role..."
                  : "Select role..."}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
              />
            </Button>
          } />
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
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn(
                          "mr-2 h-4 w-4",
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
          <PopoverTrigger render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={scopeOpen}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {row.scopeType === "ORGANIZATION" && "Organization Wide"}
                {row.scopeType === "PROJECT" && "Specific Project"}
                {row.scopeType === "DEPARTMENT" && "Specific Department"}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
              />
            </Button>
          } />
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
                    { value: "PROJECT", label: "Specific Project" },
                    { value: "DEPARTMENT", label: "Specific Department" },
                  ].map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={() => {
                        updateRow(row.id, {
                          scopeType: item.value as any,
                          scopeId:
                            item.value === "ORGANIZATION" ? organizationId : "",
                        })
                        setScopeOpen(false)
                      }}
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn(
                          "mr-2 h-4 w-4",
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
            <PopoverTrigger render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={projectOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {row.scopeId && projects?.length
                    ? projects.find((p: any) => p.id === row.scopeId)?.title ||
                      projects.find((p: any) => p.id === row.scopeId)?.name ||
                      "Select project..."
                    : "Select project..."}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className="ml-2 h-4 w-4 shrink-0 opacity-50"
                />
              </Button>
            } />
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search project..." />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    {projects?.map((project: any) => (
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
                            "mr-2 h-4 w-4",
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
      </div>

      <div className="flex w-[80px] items-center gap-2">
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRow(row.id)}
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent>
            <p>Remove Assignment</p>
          </TooltipContent>
        </Tooltip>

        {isLast && (
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                onClick={addRow}
                className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
              </Button>
            } />
            <TooltipContent>
              <p>Add Assignment</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
