"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  Add01Icon,
  ArrowDown01Icon,
  Delete02Icon,
  DocumentValidationIcon,
  Edit02Icon,
  Link02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ProjectResourcesProps {
  projectId: string
}

export function ProjectResources({ projectId }: ProjectResourcesProps) {
  const [projectBrief, setProjectBrief] = useState<string>("")
  const [isEditingBrief, setIsEditingBrief] = useState(false)
  const [isBriefOpen, setIsBriefOpen] = useState(false)
  const [links, setLinks] = useState<
    { id: string; name: string; url: string }[]
  >([])
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [linkValidationErrors, setLinkValidationErrors] = useState<
    Record<string, string>
  >({})

  const linkForm = useForm({
    defaultValues: {
      name: "",
      url: "",
    },
    onSubmit: async ({ value }) => {
      setLinkValidationErrors({})
      if (!value.name.trim() || !value.url.trim()) return

      // Add https:// if missing
      let url = value.url.trim()
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url
      }

      const updatedLinks = [
        ...links,
        { id: crypto.randomUUID(), name: value.name.trim(), url },
      ]
      setLinks(updatedLinks)
      localStorage.setItem(
        `veylo-project-links-${projectId}`,
        JSON.stringify(updatedLinks)
      )

      linkForm.reset()
      setIsAddingLink(false)
      toast.success("Resource link added")
    },
  })

  useEffect(() => {
    if (isAddingLink) {
      linkForm.reset()
    }
  }, [isAddingLink, linkForm])

  useEffect(() => {
    if (projectId) {
      // Load brief
      const savedBrief = localStorage.getItem(
        `veylo-project-brief-${projectId}`
      )
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectBrief(
        savedBrief ||
          "Align your team around a shared vision with a project brief. Click edit to add context, goals, and outline project deliverables."
      )

      // Load links
      const savedLinks = localStorage.getItem(
        `veylo-project-links-${projectId}`
      )
      if (savedLinks) {
        try {
          setLinks(JSON.parse(savedLinks))
        } catch (e) {
          console.error(e)
        }
      } else {
        setLinks([
          { id: "1", name: "Figma Mockups", url: "https://figma.com" },
          { id: "2", name: "Project Spec Document", url: "https://google.com" },
        ])
      }
    }
  }, [projectId])

  const handleSaveBrief = () => {
    localStorage.setItem(`veylo-project-brief-${projectId}`, projectBrief)
    setIsEditingBrief(false)
    toast.success("Project brief saved")
  }

  const handleDeleteLink = (id: string) => {
    const updatedLinks = links.filter((l) => l.id !== id)
    setLinks(updatedLinks)
    localStorage.setItem(
      `veylo-project-links-${projectId}`,
      JSON.stringify(updatedLinks)
    )
    toast.success("Resource link removed")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
          <HugeiconsIcon
            icon={SparklesIcon}
            className="h-4.5 w-4.5 text-primary"
          />{" "}
          Key Resources
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Align your team around a shared vision with a project brief and
          supporting links.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Brief Section */}
        {(() => {
          const isLong = (projectBrief?.length ?? 0) > 240
          return (
            <div
              className={cn(
                "relative space-y-3 overflow-visible rounded-xl border border-border bg-muted/30 p-4 transition-all duration-300",
                !isEditingBrief && isLong && !isBriefOpen ? "pb-2" : "pb-4"
              )}
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <HugeiconsIcon
                    icon={DocumentValidationIcon}
                    className="h-4 w-4 text-muted-foreground"
                  />{" "}
                  Project Brief
                </span>
                {!isEditingBrief ? (
                  <Button
                    variant="outline-default"
                    size="sm"
                    onClick={() => setIsEditingBrief(true)}
                  >
                    <HugeiconsIcon icon={Edit02Icon} />
                    Edit Brief
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={handleSaveBrief}
                      className="h-6 px-2 text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingBrief(false)}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    height:
                      !isEditingBrief && isLong && !isBriefOpen ? 96 : "auto",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  {isEditingBrief ? (
                    <Textarea
                      value={projectBrief}
                      onChange={(e) => setProjectBrief(e.target.value)}
                      className="min-h-30 w-full resize-y"
                    />
                  ) : (
                    <p className="font-sans text-sm leading-relaxed font-normal whitespace-pre-wrap text-muted-foreground">
                      {projectBrief}
                    </p>
                  )}
                </motion.div>

                {/* Faded background effect for collapsed state */}
                <AnimatePresence>
                  {!isEditingBrief && isLong && !isBriefOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Toggle button */}
              {!isEditingBrief && isLong && (
                <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full bg-card shadow-sm hover:bg-muted"
                    onClick={() => setIsBriefOpen(!isBriefOpen)}
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={cn(
                        "transition-transform duration-300",
                        isBriefOpen && "rotate-180"
                      )}
                    />
                    <span className="sr-only">Toggle brief</span>
                  </Button>
                </div>
              )}
            </div>
          )
        })()}

        {/* Resources Links Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
              <HugeiconsIcon
                icon={Link02Icon}
                className="h-4 w-4 text-muted-foreground"
              />{" "}
              Reference Links
            </span>
            <Button
              variant="outline-default"
              size="sm"
              onClick={() => setIsAddingLink(!isAddingLink)}
              className="h-7 text-2xs font-bold uppercase"
            >
              <HugeiconsIcon icon={Add01Icon} className="mr-1 h-3 w-3" /> Add
              Link
            </Button>
          </div>

          {isAddingLink && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                linkForm.handleSubmit()
              }}
              className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <linkForm.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Link name is required"
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (linkValidationErrors.name)
                      fieldErrors.push(linkValidationErrors.name)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length
                    return (
                      <div className="flex-1 space-y-1">
                        <Input
                          type="text"
                          placeholder="e.g. Design Files"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value)
                            setLinkValidationErrors((prev) => ({
                              ...prev,
                              name: "",
                            }))
                          }}
                          className="h-8 rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="mt-1 text-xs font-medium text-destructive">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </linkForm.Field>

                <linkForm.Field
                  name="url"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "URL is required"
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (linkValidationErrors.url)
                      fieldErrors.push(linkValidationErrors.url)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length
                    return (
                      <div className="flex-1 space-y-1">
                        <Input
                          type="text"
                          placeholder="e.g. figma.com/project"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value)
                            setLinkValidationErrors((prev) => ({
                              ...prev,
                              url: "",
                            }))
                          }}
                          className="h-8 rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="mt-1 text-2xs font-medium text-destructive">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </linkForm.Field>
              </div>
              <div className="flex justify-end gap-1.5">
                <Button type="submit" size="sm" className="py-1.5 text-xs">
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingLink(false)}
                  className="py-1.5 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="group flex items-center justify-between rounded-xl border p-2.5 transition-colors hover:bg-muted/50"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 truncate text-xs font-semibold text-primary hover:underline"
                >
                  <HugeiconsIcon
                    icon={Link02Icon}
                    className="h-3.5 w-3.5 text-primary"
                  />
                  <span className="truncate text-sm">{link.name}</span>
                </a>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic">
                No resource links added yet.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
