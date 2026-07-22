export interface Project {
  id: string
  title: string
  projectKey: string
  description: string | null
  icon: string | null
  workspaceId: string
  createdAt: string
  deletedAt?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  workspaceName?: string
  workspaceSlug?: string
  _count?: {
    members: number
  }
}

export interface ProjectTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  category: string
  isSystem: boolean
  config: Record<string, unknown>
}

export interface WorkspaceMember {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export interface ProjectMember {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export const STATUS_OPTIONS = [
  {
    value: "on_track",
    label: "On Track",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  {
    value: "at_risk",
    label: "At Risk",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  {
    value: "off_track",
    label: "Off Track",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  {
    value: "on_hold",
    label: "On Hold",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
]
