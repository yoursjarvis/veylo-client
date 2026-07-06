"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target02Icon, ArrowRight01Icon, Briefcase02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { Project, Epic } from "@/types/models"
import { useProjectEpics } from "@/features/tasks/hooks/use-tasks"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


type KeyResult = {
  id: string
  title: string
  progress: number
  target: string
}

type Objective = {
  id: string
  title: string
  description: string
  progress: number
  keyResults: KeyResult[]
  linkedProjects: string[]
}

const mockOkrs: Objective[] = [
  {
    id: "obj-1",
    title: "Accelerate Product Growth",
    description: "Launch key features to drive user acquisition and retention.",
    progress: 65,
    keyResults: [
      { id: "kr-1", title: "Increase MAU by 20%", progress: 80, target: "20%" },
      { id: "kr-2", title: "Launch new Portfolio dashboard", progress: 50, target: "100%" },
    ],
    linkedProjects: ["Frontend Redesign", "Backend API V2"],
  },
  {
    id: "obj-2",
    title: "Improve Platform Stability",
    description: "Reduce downtime and improve core web vitals.",
    progress: 30,
    keyResults: [
      { id: "kr-3", title: "Achieve 99.99% uptime", progress: 40, target: "99.99%" },
      { id: "kr-4", title: "Reduce latency to < 100ms", progress: 20, target: "100ms" },
    ],
    linkedProjects: ["Infra Migration"],
  },
]

export function OkrsDashboard() {
  const { activeWorkspace } = useWorkspaceContext()
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return []
      const response = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/projects`
      )
      return response.data.data
    },
    enabled: !!activeWorkspace,
  })

  const [expandedObj, setExpandedObj] = useState<string | null>(mockOkrs[0].id)
  const [okrs, setOkrs] = useState<Objective[]>(mockOkrs)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newKrTitle, setNewKrTitle] = useState("")
  const [newKrTarget, setNewKrTarget] = useState("")
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedEpicId, setSelectedEpicId] = useState<string>("")
  
  const { data: epics = [] } = useProjectEpics(selectedProjectId)


  const handleCreate = () => {
    if (!newTitle.trim()) return
    
    const keyResults: KeyResult[] = []
    if (newKrTitle.trim()) {
      keyResults.push({
        id: `kr-${Date.now()}`,
        title: newKrTitle,
        progress: 0,
        target: newKrTarget || "100%"
      })
    }
    
    const linkedProjects: string[] = []
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId)
      if (proj) linkedProjects.push(proj.name)
    }
    if (selectedEpicId) {
      const epic = epics.find((e: Epic) => e.id === selectedEpicId)
      if (epic) linkedProjects.push(epic.title)
    }

    const newOkr: Objective = {
      id: `obj-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      progress: 0,
      keyResults,
      linkedProjects
    }
    setOkrs([newOkr, ...okrs])
    
    // Reset Form
    setNewTitle("")
    setNewDesc("")
    setNewKrTitle("")
    setNewKrTarget("")
    setSelectedProjectId("")
    setSelectedEpicId("")
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goals & OKRs</h2>
          <p className="text-muted-foreground">
            Company-wide Objectives and Key Results linked to your active projects.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <HugeiconsIcon icon={Target02Icon} className="mr-2 h-4 w-4" />
              New Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Objective</DialogTitle>
              <DialogDescription>Define a high-level goal for your organization.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Objective Title</Label>
                <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Expand into Enterprise Market" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short summary of this objective" />
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Initial Key Result</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="kr-title" className="text-xs">KR Title</Label>
                    <Input id="kr-title" value={newKrTitle} onChange={(e) => setNewKrTitle(e.target.value)} placeholder="e.g. Increase MAU by 20%" />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="kr-target" className="text-xs">Target</Label>
                    <Input id="kr-target" value={newKrTarget} onChange={(e) => setNewKrTarget(e.target.value)} placeholder="e.g. 20%" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-2 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Link Project & Epic</h4>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProjectId} onValueChange={(val) => { setSelectedProjectId(val); setSelectedEpicId("") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProjectId && (
                  <div className="space-y-2">
                    <Label>Epic (Optional)</Label>
                    <Select value={selectedEpicId} onValueChange={setSelectedEpicId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an epic" />
                      </SelectTrigger>
                      <SelectContent>
                        {epics.length === 0 && <SelectItem value="none" disabled>No epics found</SelectItem>}
                        {epics.map((e: Epic) => (
                          <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Objective</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {okrs.map((obj) => (
          <Card key={obj.id} className="overflow-hidden">
            <div
              className="cursor-pointer p-6 transition-colors hover:bg-muted/50"
              onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{obj.title}</h3>
                  <p className="text-sm text-muted-foreground">{obj.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Progress value={obj.progress} className="w-[100px] md:w-[150px] h-2" />
                    <span className="text-sm font-medium w-10 text-right">{obj.progress}%</span>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      expandedObj === obj.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {expandedObj === obj.id && (
              <CardContent className="bg-muted/30 border-t p-6">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <HugeiconsIcon icon={Target02Icon} className="mr-2 h-4 w-4 text-primary" />
                      Key Results
                    </h4>
                    <div className="space-y-4">
                      {obj.keyResults.map((kr) => (
                        <div key={kr.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{kr.title}</span>
                            <span className="text-muted-foreground">Target: {kr.target}</span>
                          </div>
                          <Progress value={kr.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <HugeiconsIcon icon={Briefcase02Icon} className="mr-2 h-4 w-4 text-primary" />
                      Linked Projects & Epics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {obj.linkedProjects.map((project, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
