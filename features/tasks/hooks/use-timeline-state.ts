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

      // Helper to recursively add a task and its subtasks
      const addTaskWithSubtasks = (
        task: TimelineTask,
        allTasksInGroup: TimelineTask[],
        childMap: Map<string, TimelineTask[]>,
        baseDepth: number
      ) => {
        const children = childMap.get(task.id) || []
        const hasChildren = children.length > 0
        const isExpanded = !!expandedNodes[task.id]

        flatList.push({
          id: task.id,
          title: task.title,
          depth: baseDepth,
          isVirtualGroup: false,
          hasChildren,
          isExpanded,
          task,
        })

        if (hasChildren && isExpanded) {
          children.forEach((child) =>
            addTaskWithSubtasks(child, allTasksInGroup, childMap, baseDepth + 1)
          )
        }
      }

      // Helper to build parent-child map and get root tasks for a group
      const buildTreeForGroup = (groupTasks: TimelineTask[], baseDepth: number) => {
        // Build a set of task IDs within this group for fast lookup
        const groupTaskIds = new Set(groupTasks.map((t) => t.id))
        const childMap = new Map<string, TimelineTask[]>()
        const rootTasks: TimelineTask[] = []

        groupTasks.forEach((t) => {
          // If task has a parent AND that parent is in this group, it's a child
          if (t.parentTaskId && groupTaskIds.has(t.parentTaskId)) {
            const children = childMap.get(t.parentTaskId) || []
            children.push(t)
            childMap.set(t.parentTaskId, children)
          } else {
            // Otherwise it's a root-level task in this group
            rootTasks.push(t)
          }
        })

        rootTasks.forEach((task) =>
          addTaskWithSubtasks(task, groupTasks, childMap, baseDepth)
        )
      }

      // Grouping logic based on groupType
      const groupByField = (
        getKey: (t: TimelineTask) => string,
        getLabel: (t: TimelineTask) => string
      ) => {
        const groups = new Map<string, { label: string; tasks: TimelineTask[] }>()
        tasks.forEach((t) => {
          const key = getKey(t)
          if (!groups.has(key)) {
            groups.set(key, { label: getLabel(t), tasks: [] })
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
            buildTreeForGroup(group.tasks, 1)
          }
        })
      }

      if (groupType === "assignee") {
        groupByField(
          (t) => `assignee-${t.assignee?.id || "unassigned"}`,
          (t) => t.assignee?.name || "Unassigned"
        )
      } else if (groupType === "sprint") {
        groupByField(
          (t) => `sprint-${t.sprint?.id || "backlog"}`,
          (t) => t.sprint?.name || "Backlog"
        )
      } else if (groupType === "milestone") {
        groupByField(
          (t) => `milestone-${t.milestone?.id || "no-milestone"}`,
          (t) => t.milestone?.title || "No Milestone"
        )
      } else if (groupType === "status") {
        groupByField(
          (t) => `status-${t.status?.id || t.status?.category || "backlog"}`,
          (t) => t.status?.name || "Backlog"
        )
      } else if (groupType === "priority") {
        groupByField(
          (t) => `priority-${t.priority || "medium"}`,
          (t) => t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium"
        )
      } else if (groupType === "project") {
        groupByField(
          (t) => `project-${t.projectId}`,
          (t) => t.projectTitle || "Default Project"
        )
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
