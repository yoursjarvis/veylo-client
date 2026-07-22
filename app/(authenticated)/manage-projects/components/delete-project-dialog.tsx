import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { axiosInstance } from "@/lib/axios"

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
import { Project } from "../types"

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
}: DeleteProjectDialogProps) {
  const queryClient = useQueryClient()

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return axiosInstance.delete(`/projects/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted successfully")
      onOpenChange(false)
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete project")
    },
  })

  const handleDelete = () => {
    if (!project) return
    deleteProjectMutation.mutate(project.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-border/50 bg-card p-6 text-foreground shadow-lg">
        <AlertDialogHeader className="pb-2">
          <AlertDialogTitle className="text-lg font-bold">
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {project?.title}
            </span>
            ? This action moves the project to trash and can be restored later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-border/40 pt-2">
          <AlertDialogCancel className="h-9 text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
            className="h-9 bg-destructive text-xs text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
