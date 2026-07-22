"use client"

import React, { useState, useEffect } from "react"
import { useProject } from "../../layout"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Plus, Trash2, ArrowRight, GitBranch, ShieldAlert } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Transition {
  id: string
  fromStatusId: string
  toStatusId: string
  requiredRoleId?: string | null
  fromStatus: { name: string }
  toStatus: { name: string }
  requiredRole?: { name: string }
}

export default function WorkflowSettingsPage() {
  const { projectId } = useProject()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissions()

  const canRead = hasPermission("project-workflow:read")
  const canCreate = hasPermission("project-workflow:create")
  const canDelete = hasPermission("project-workflow:delete")

  const [transitions, setTransitions] = useState<Transition[]>([])
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])

  const [newTransition, setNewTransition] = useState({
    fromStatusId: "",
    toStatusId: "",
    requiredRoleId: "",
  })

  const { data: projectData } = useQuery({
    queryKey: ["project-statuses", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/statuses`)
      return res.data.data
    },
  })

  const { data: projectRoles } = useQuery({
    queryKey: ["project-roles", projectId],
    queryFn: async () => {
      // This endpoint might need to be created, assuming generic role fetch for now
      const res = await axiosInstance.get(`/projects/${projectId}/roles`)
      return res.data.data
    },
  })

  const { data: workflowData } = useQuery({
    queryKey: ["project-workflow", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/workflow`)
      return res.data.data
    },
  })

  useEffect(() => {
    setTimeout(() => {
      if (projectData) setStatuses(projectData)
      if (projectRoles) setRoles(projectRoles)
      if (workflowData) setTransitions(workflowData)
    }, 0)
  }, [projectData, projectRoles, workflowData])

  const addTransitionMutation = useMutation({
    mutationFn: async (data: {
      projectId: string
      organizationId: string
      fromStatusId: string
      toStatusId: string
      requiredRoleId?: string | null
    }) => {
      const res = await axiosInstance.post("/workflow/transitions", data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-workflow", projectId],
      })
      toast.success("Transition added successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to add transition")
    },
  })

  const deleteTransitionMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/workflow/transitions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-workflow", projectId],
      })
      toast.success("Transition removed")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to remove transition")
    },
  })

  if (!canRead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view project workflow.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <GitBranch className="h-5 w-5 text-primary" /> Workflow Engine
          </h3>
          <p className="mt-1 text-xs">
            Define valid state transitions for tasks in this project. If no
            rules are defined, all transitions are permitted.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {canCreate && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Create New Transition
              </CardTitle>
              <CardDescription className="text-xs">
                Specify which status change is allowed and who can perform it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">From Status</label>
                <Select
                  value={newTransition.fromStatusId}
                  onValueChange={(v) =>
                    setNewTransition((p) => ({ ...p, fromStatusId: v || "" }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-center pb-3">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">To Status</label>
                <Select
                  value={newTransition.toStatusId}
                  onValueChange={(v) =>
                    setNewTransition((p) => ({ ...p, toStatusId: v || "" }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Required Role (Optional)
                </label>
                <Select
                  value={newTransition.requiredRoleId}
                  onValueChange={(v) =>
                    setNewTransition((p) => ({ ...p, requiredRoleId: v || "" }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="mt-2 w-fit sm:col-span-4"
                disabled={
                  !newTransition.fromStatusId ||
                  !newTransition.toStatusId ||
                  addTransitionMutation.isPending
                }
                onClick={() => {
                  addTransitionMutation.mutate({
                    projectId,
                    organizationId: projectData?.[0]?.organizationId || "", // Fallback
                    fromStatusId: newTransition.fromStatusId,
                    toStatusId: newTransition.toStatusId,
                    requiredRoleId: newTransition.requiredRoleId || null,
                  })
                  setNewTransition({
                    fromStatusId: "",
                    toStatusId: "",
                    requiredRoleId: "",
                  })
                }}
              >
                {addTransitionMutation.isPending ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add Transition
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Active Transitions
            </CardTitle>
            <CardDescription className="text-xs">
              The following rules are currently enforced. Tasks cannot move
              between statuses unless a transition is defined here (when the
              system is in Strict Mode).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="h-10 px-4 font-medium text-muted-foreground">
                      From
                    </th>
                    <th className="h-10 px-4 font-medium text-muted-foreground">
                      To
                    </th>
                    <th className="h-10 px-4 font-medium text-muted-foreground">
                      Required Role
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transitions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No transition rules defined. All moves are currently
                        allowed.
                      </td>
                    </tr>
                  ) : (
                    transitions.map((t) => (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium">{t.fromStatus.name}</td>
                        <td className="p-4 font-medium">{t.toStatus.name}</td>
                        <td className="p-4">
                          {t.requiredRole ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <ShieldAlert className="h-3 w-3 text-amber-500" />
                              {t.requiredRole.name}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Any Role
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                deleteTransitionMutation.mutate(t.id)
                              }
                              disabled={deleteTransitionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
