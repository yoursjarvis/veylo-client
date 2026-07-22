"use client"

import {
  CommandItem,
  CommandPalette,
} from "@/components/motion/command-palette"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  Briefcase,
  CheckSquare,
  Clock,
  Folder,
  Home,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "use-debounce"

export interface SearchWorkspace {
  id: string
  name: string
  slug: string
}

export interface SearchProject {
  id: string
  title: string
  projectKey: string
  workspace?: { slug: string }
}

export interface SearchTask {
  id: string
  title: string
  taskKey: string
  project?: { id: string; workspace?: { slug: string } }
  workspace?: { slug: string }
}

export function CommandCenter({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (o: boolean) => void
}) {
  const router = useRouter()
  const { activeWorkspace } = useWorkspaceContext()
  const { hasPermission } = usePermissions()
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen =
    isControlled && onOpenChange ? onOpenChange : setInternalOpen
  const { setTheme } = useTheme()

  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 300)

  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(
          window.localStorage.getItem("veylo-search-history") || "[]"
        )
      } catch (e) {
        return []
      }
    }
    return []
  })

  const saveToHistory = useCallback((itemTitle: string) => {
    setHistory((prevHistory) => {
      const newHistory = [
        itemTitle,
        ...prevHistory.filter((h) => h !== itemTitle),
      ].slice(0, 3)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "veylo-search-history",
          JSON.stringify(newHistory)
        )
      }
      return newHistory
    })
  }, [])

  // Listen for Ctrl+K
  useEffect(() => {
    if (isControlled) return // CommandPalette handles it, or AppHeader handles it. Actually, CommandPalette handles Ctrl+K if open is undefined, but since we want to trigger it from AppHeader too, we might manage state here or in AppHeader.
    // If AppHeader controls it, this effect shouldn't do anything if isControlled is true.
  }, [isControlled])

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["global-search", activeWorkspace?.slug, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { workspaces: [], projects: [], tasks: [] }
      const res = await axiosInstance.get(
        `/search?q=${encodeURIComponent(debouncedQuery)}`
      )
      return res.data.data
    },
    enabled: !!debouncedQuery && isOpen,
  })

  const canCreateTask = hasPermission("task:create") && !!activeWorkspace
  const canCreateProject = hasPermission("project:create")
  const canCreateWorkspace = hasPermission("workspace:create")
  const canReadProjects = hasPermission("project:read")
  const canReadTasks = hasPermission("task:read")
  const canReadOkrs = hasPermission("goal-okrs:read")
  const canReadTimesheets = hasPermission("timesheet:read")
  const canReadPortfolio = hasPermission("portfolio:read")
  const canReadWorkspaces = hasPermission("workspace:read")

  const items = useMemo(() => {
    // Wrap original onSelect to save history
    const wrapOnSelect =
      (title: string, originalOnSelect: () => void) => () => {
        saveToHistory(title)
        originalOnSelect()
      }

    if (!debouncedQuery) {
      const defaultActions: CommandItem[] = []

      // History
      history.forEach((hItem, idx) => {
        defaultActions.push({
          id: `history-${idx}`,
          label: hItem,
          group: "Recent Searches",
          icon: Search,
          onSelect: () => setQuery(hItem), // Selecting history populates the search query
        })
      })

      if (canCreateTask) {
        defaultActions.push({
          id: "create-task",
          label: "Create Task",
          group: "Actions",
          icon: CheckSquare,
          onSelect: wrapOnSelect("Create Task", () => {
            window.dispatchEvent(new CustomEvent("open-create-task-global"))
          }),
        })
      }

      if (canCreateProject) {
        defaultActions.push({
          id: "create-project",
          label: "Create Project",
          group: "Actions",
          icon: Briefcase,
          onSelect: wrapOnSelect("Create Project", () => {
            if (activeWorkspace) {
              router.push(`/${activeWorkspace.slug}/projects`)
            }
          }),
        })
      }

      if (canCreateWorkspace) {
        defaultActions.push({
          id: "create-workspace",
          label: "Create Workspace",
          group: "Actions",
          icon: Plus,
          onSelect: wrapOnSelect("Create Workspace", () => {
            router.push(`/org-setup`)
          }),
        })
      }

      if (activeWorkspace) {
        defaultActions.push({
          id: "nav-dashboard",
          label: "Go to Dashboard",
          group: "Navigation",
          icon: Home,
          onSelect: wrapOnSelect("Dashboard", () =>
            router.push(`/${activeWorkspace.slug}/dashboard`)
          ),
        })
        if (canReadProjects) {
          defaultActions.push({
            id: "nav-projects",
            label: "Go to Projects",
            group: "Navigation",
            icon: Briefcase,
            onSelect: wrapOnSelect("Projects", () =>
              router.push(`/${activeWorkspace.slug}/projects`)
            ),
          })
        }
        if (canReadTasks) {
          defaultActions.push({
            id: "nav-tasks",
            label: "Go to My Tasks",
            group: "Navigation",
            icon: CheckSquare,
            onSelect: wrapOnSelect("My Tasks", () =>
              router.push(`/${activeWorkspace.slug}/tasks`)
            ),
          })
        }
        if (canReadOkrs) {
          defaultActions.push({
            id: "nav-okrs",
            label: "Go to Goals & OKRs",
            group: "Navigation",
            icon: Target,
            onSelect: wrapOnSelect("Goals & OKRs", () =>
              router.push(`/${activeWorkspace.slug}/okrs`)
            ),
          })
        }
        if (canReadTimesheets) {
          defaultActions.push({
            id: "nav-timesheets",
            label: "Go to Timesheets",
            group: "Navigation",
            icon: Clock,
            onSelect: wrapOnSelect("Timesheets", () =>
              router.push(`/${activeWorkspace.slug}/timesheets`)
            ),
          })
        }
        if (canReadPortfolio) {
          defaultActions.push({
            id: "nav-portfolio",
            label: "Go to Portfolio",
            group: "Navigation",
            icon: Activity,
            onSelect: wrapOnSelect("Portfolio", () =>
              router.push(`/${activeWorkspace.slug}/portfolio`)
            ),
          })
        }
      }

      defaultActions.push({
        id: "theme-light",
        label: "Switch to Light Theme",
        group: "Preferences",
        icon: Sun,
        onSelect: () => setTheme("light"),
      })
      defaultActions.push({
        id: "theme-dark",
        label: "Switch to Dark Theme",
        group: "Preferences",
        icon: Moon,
        onSelect: () => setTheme("dark"),
      })
      defaultActions.push({
        id: "theme-system",
        label: "Switch to System Theme",
        group: "Preferences",
        icon: Monitor,
        onSelect: () => setTheme("system"),
      })

      return defaultActions
    }

    const results: CommandItem[] = []

    if (canReadWorkspaces && searchResults?.workspaces) {
      searchResults.workspaces.forEach((w: SearchWorkspace) => {
        results.push({
          id: `workspace-${w.id}`,
          label: w.name,
          group: "Workspaces",
          icon: Folder,
          onSelect: wrapOnSelect(w.name, () => router.push(`/${w.slug}`)),
        })
      })
    }

    if (canReadProjects && searchResults?.projects) {
      searchResults.projects.forEach((p: SearchProject) => {
        results.push({
          id: `project-${p.id}`,
          label: p.title,
          group: "Projects",
          icon: Briefcase,
          hint: p.projectKey,
          onSelect: wrapOnSelect(p.title, () => {
            const wsSlug = p.workspace?.slug || activeWorkspace?.slug
            router.push(`/${wsSlug}/projects/${p.id}`)
          }),
        })
      })
    }

    if (canReadTasks && searchResults?.tasks) {
      searchResults.tasks.forEach((t: SearchTask) => {
        results.push({
          id: `task-${t.id}`,
          label: t.title,
          group: "Tasks",
          icon: CheckSquare,
          hint: t.taskKey,
          onSelect: wrapOnSelect(t.title, () => {
            const wsSlug = t.project?.workspace?.slug || activeWorkspace?.slug
            router.push(`/${wsSlug}/tasks/${t.id}`)
          }),
        })
      })
    }

    return results
  }, [
    debouncedQuery,
    searchResults,
    saveToHistory,
    history,
    canCreateTask,
    canCreateProject,
    canCreateWorkspace,
    canReadProjects,
    canReadTasks,
    canReadOkrs,
    canReadTimesheets,
    canReadPortfolio,
    canReadWorkspaces,
    activeWorkspace,
    router,
    setTheme,
  ])

  // We have to intercept CommandPalette's built-in search so it acts as API search.
  // Wait, CommandPalette internally filters `items` by `fuzzyMatch`.
  // If we pass our items, CommandPalette will fuzzy match them again. That's fine.
  // But how to get CommandPalette's input query out to trigger useQuery?
  // CommandPalette has an uncontrolled internal `query` state.
  // Actually, CommandPalette does NOT export `onSearch` prop.
  // Let me check if CommandPalette accepts `query` / `onQueryChange`.
  return (
    <CommandPalette
      open={isOpen}
      onOpenChange={setIsOpen}
      query={query}
      onQueryChange={setQuery}
      items={items}
      shouldFilter={false}
      shortcut="k"
      placeholder="Search projects, tasks, or type a command..."
    />
  )
}
