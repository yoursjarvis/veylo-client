"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { axiosInstance } from "@/lib/axios"
import {
  Cancel01Icon,
  DocumentValidationIcon,
  Edit03Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ProjectDescriptionProps {
  projectId: string
  initialDescription?: string | null
}

export function ProjectDescription({
  projectId,
  initialDescription,
}: ProjectDescriptionProps) {
  const queryClient = useQueryClient()
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescriptionValue(initialDescription || "")
  }, [initialDescription])

  const updateDescription = async () => {
    try {
      await axiosInstance.patch(`/projects/${projectId}`, {
        description: descriptionValue,
      })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      setIsEditingDesc(false)
      toast.success("Project description updated")
    } catch {
      toast.error("Failed to update description")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
          <HugeiconsIcon
            icon={DocumentValidationIcon}
            className="h-4.5 w-4.5 text-primary"
          />{" "}
          Project Description
        </CardTitle>
        {!isEditingDesc ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingDesc(true)}
          >
            <HugeiconsIcon icon={Edit03Icon} className="mr-1 h-3.5 w-3.5" />{" "}
            Edit
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button size="sm" onClick={updateDescription}>
              <HugeiconsIcon icon={SaveIcon} className="mr-1 h-3.5 w-3.5" />{" "}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDesc(false)}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditingDesc ? (
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="Describe your project goals, scope, and timeline..."
            className="min-h-25 w-full resize-y rounded-md border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        ) : (
          <p className="text-sm leading-relaxed font-normal whitespace-pre-wrap text-foreground">
            {initialDescription || (
              <span className="text-muted-foreground italic">
                No description has been added to this project. Click edit to add
                one.
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
