"use client"

import { useState, useMemo, useCallback } from "react"

export type TaskGroupType =
  | "standard"
  | "assignee"
  | "project"
  | "sprint"
  | "milestone"
  | "status"
  | "priority"

export interface TimelineTask {
  id: string
  title: string
  projectId: string
  projectTitle: string
  type: string
  priority: string
  status: { name: string; category: string; id?: string }
  createdAt: string
  startDate?: string | null
  dueDate?: string
  blockedByDependencies?: { blockingTaskId: string }[]
  assignee?: { id?: string; name?: string; image?: string }
  deletedAt?: string
  parentTaskId?: string | null
  sprint?: { id: string; name: string } | null
  milestone?: { id: string; title: string } | null
}

// Flat row representation for the virtual list
export interface FlatRow {
  id: string // Can be a task ID or virtual group ID (e.g., "group-assignee-john")
  title: string
  depth: number
  isVirtualGroup: boolean
  hasChildren: boolean
  isExpanded: boolean
  task?: TimelineTask
  groupType?: TaskGroupType
  groupValue?: string
}

export function useTimelineState() {
  const [activeLayout, setActiveLayout] = useState<TaskGroupType>("standard")
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const setExpanded = useCallback((id: string, isExpanded: boolean) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: isExpanded,
    }))
  }, [])

  const toggleSelectTask = useCallback((id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }, [])

  const selectTasks = useCallback((ids: string[]) => {
    setSelectedTaskIds(ids)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTaskIds([])
  }, [])

  // Helper to build hierarchy flat list for Standard View
  const buildStandardHierarchy = useCallback(
    (tasks: TimelineTask[]): FlatRow[] => {
      // Find root tasks (tasks without a parent task, or where parent is not in the tasks list)
      const taskMap = new Map<string, TimelineTask>()
      tasks.forEach((t) => taskMap.set(t.id, t))

      const rootTasks: TimelineTask[] = []
      const childMap = new Map<string, TimelineTask[]>()

      tasks.forEach((t) => {
        const parentId = t.parentTaskId
        if (parentId && taskMap.has(parentId)) {
          const children = childMap.get(parentId) || []
          children.push(t)
          childMap.set(parentId, children)
        } else {
          rootTasks.push(t)
        }
      })

      const flatList: FlatRow[] = []

      const recurse = (task: TimelineTask, depth: number) => {
        const children = childMap.get(task.id) || []
        const hasChildren = children.length > 0
        const isExpanded = !!expandedNodes[task.id]

        flatList.push({
          id: task.id,
          title: task.title,
          depth,
          isVirtualGroup: false,
          hasChildren,
          isExpanded,
          task,
        })

        if (hasChildren && isExpanded) {
          children.forEach((child) => recurse(child, depth + 1))
        }
      }

      rootTasks.forEach((root) => recurse(root, 0))
      return flatList
    },
    [expandedNodes]
  )

  // Helper to group tasks by a field / virtual parents
  const buildGroupedHierarchy = useCallback(
    (
      tasks: TimelineTask[],
      groupType: TaskGroupType
    ): FlatRow[] => {
      const flatList: FlatRow[] = []

      // Create standard groupings
      if (groupType === "assignee") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const assigneeName = t.assignee?.name || "Unassigned"
          const assigneeId = t.assignee?.id || "unassigned"
          const key = `assignee-${assigneeId}`
          if (!groups.has(key)) {
            groups.set(key, { label: assigneeName, tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false // Default open grouped headers
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      } else if (groupType === "sprint") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const sprintName = t.sprint?.name || "Backlog"
          const sprintId = t.sprint?.id || "backlog"
          const key = `sprint-${sprintId}`
          if (!groups.has(key)) {
            groups.set(key, { label: sprintName, tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      } else if (groupType === "milestone") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const milestoneTitle = t.milestone?.title || "No Milestone"
          const milestoneId = t.milestone?.id || "no-milestone"
          const key = `milestone-${milestoneId}`
          if (!groups.has(key)) {
            groups.set(key, { label: milestoneTitle, tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      } else if (groupType === "status") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const statusName = t.status?.name || "Backlog"
          const statusId = t.status?.id || t.status?.category || "backlog"
          const key = `status-${statusId}`
          if (!groups.has(key)) {
            groups.set(key, { label: statusName, tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      } else if (groupType === "priority") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const priorityLabel = t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium"
          const key = `priority-${t.priority || "medium"}`
          if (!groups.has(key)) {
            groups.set(key, { label: priorityLabel, tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      } else if (groupType === "project") {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const key = `project-${t.projectId}`
          if (!groups.has(key)) {
            groups.set(key, { label: t.projectTitle || "Default Project", tasks: [] })
          }
          groups.get(key)!.tasks.push(t)
        })

        groups.forEach((group, key) => {
          const isExpanded = expandedNodes[key] !== false
          flatList.push({
            id: key,
            title: group.label,
            depth: 0,
            isVirtualGroup: true,
            hasChildren: group.tasks.length > 0,
            isExpanded,
            groupType,
            groupValue: key,
          })

          if (isExpanded) {
            group.tasks.forEach((t) => {
              flatList.push({
                id: t.id,
                title: t.title,
                depth: 1,
                isVirtualGroup: false,
                hasChildren: false,
                isExpanded: false,
                task: t,
              })
            })
          }
        })
      }

      return flatList
    },
    [expandedNodes]
  )

  // Generate flattened visible rows based on grouping and tasks
  const getVisibleRows = useCallback(
    (tasks: TimelineTask[]): FlatRow[] => {
      if (activeLayout === "standard") {
        return buildStandardHierarchy(tasks)
      }
      return buildGroupedHierarchy(tasks, activeLayout)
    },
    [activeLayout, buildStandardHierarchy, buildGroupedHierarchy]
  )

  return {
    activeLayout,
    setActiveLayout,
    expandedNodes,
    toggleExpand,
    setExpanded,
    selectedTaskIds,
    toggleSelectTask,
    selectTasks,
    clearSelection,
    getVisibleRows,
  }
}
