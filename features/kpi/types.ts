export type KpiLeaderboardEntry = {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  totalPoints: number
}

export type KpiTransaction = {
  id: string
  points: number
  reason: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string | null
  }
  task?: {
    id: string
    title: string
    taskKey: string
    projectId: string
  } | null
}

export type KpiPaginatedTransactions = {
  transactions: KpiTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type KpiLeaderboardResponse = {
  kpiEnabled: boolean
  leaderboard: KpiLeaderboardEntry[]
}

export type KpiUserStats = {
  userId: string
  totalPoints: number
  rank: number
  weeklyPoints: number[]
  isAdminOrOwner: boolean
}

export type KpiAccessibleProject = {
  id: string
  title: string
}

export type KpiAllProject = {
  id: string
  title: string
}
