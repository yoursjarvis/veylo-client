"use client"

import React, { createContext, useContext, useState } from "react"
import { useWorkspaces, Workspace } from "@/hooks/use-workspaces"

interface WorkspaceContextType {
  workspaces: Workspace[] | undefined
  activeWorkspace: Workspace | null
  setActiveWorkspace: (id: string) => void
  isLoading: boolean
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const workspaceData = useWorkspaces()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <WorkspaceContext.Provider
      value={{ ...workspaceData, isCreateModalOpen, setIsCreateModalOpen }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider"
    )
  }
  return context
}
