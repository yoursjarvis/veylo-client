"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { axiosInstance } from "@/lib/axios"
import { cn } from "@/lib/utils"
import {
  ArrowDown01Icon,
  Cancel01Icon,
  DocumentValidationIcon,
  Edit02Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
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

  const [isOpen, setIsOpen] = useState(false)

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

  const isLong = (initialDescription?.length ?? 0) > 240

  return (
    <Card className="relative mt-2 overflow-visible pb-1">
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
            variant="outline-default"
            size="sm"
            onClick={() => setIsEditingDesc(true)}
          >
            <HugeiconsIcon icon={Edit02Icon} className="mr-1 h-3.5 w-3.5" />{" "}
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
      <CardContent
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          !isEditingDesc && isLong && !isOpen ? "pb-0" : "pb-6"
        )}
      >
        <motion.div
          initial={false}
          animate={{
            height: !isEditingDesc && isLong && !isOpen ? 96 : "auto",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {isEditingDesc ? (
            <Textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Describe your project goals, scope, and timeline..."
              className="min-h-25 w-full resize-y"
            />
          ) : (
            <p className="text-sm leading-relaxed font-normal whitespace-pre-wrap text-foreground">
              {initialDescription || (
                <span className="text-muted-foreground italic">
                  No description has been added to this project. Click edit to
                  add one.
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* Faded background effect for collapsed state */}
        <AnimatePresence>
          {!isEditingDesc && isLong && !isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent"
            />
          )}
        </AnimatePresence>
      </CardContent>

      {/* Toggle button */}
      {!isEditingDesc && isLong && (
        <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full bg-card shadow-sm hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className={cn(
                "transition-transform duration-300",
                isOpen && "rotate-180"
              )}
            />
            <span className="sr-only">Toggle description</span>
          </Button>
        </div>
      )}
    </Card>
  )
}
