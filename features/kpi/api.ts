import { axiosInstance } from "@/lib/axios"
import type {
  KpiAccessibleProject,
  KpiAllProject,
  KpiLeaderboardResponse,
  KpiPaginatedTransactions,
  KpiUserStats,
} from "./types"

type KpiFilters = {
  userId?: string
  projectIds?: string[]
  startDate?: string
  endDate?: string
}

export async function fetchKpiLeaderboard(
  workspaceId: string,
  filters: Omit<KpiFilters, "userId"> = {}
): Promise<KpiLeaderboardResponse> {
  const params = new URLSearchParams()

  if (filters.projectIds?.length) {
    filters.projectIds.forEach((id) => params.append("projectIds", id))
  }
  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)

  const query = params.toString()
  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/kpi/leaderboard${query ? `?${query}` : ""}`
  )
  return response.data.data
}

export async function fetchKpiTransactions(
  workspaceId: string,
  page: number,
  limit: number,
  filters: KpiFilters = {}
): Promise<KpiPaginatedTransactions> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", String(limit))

  if (filters.userId) params.set("userId", filters.userId)
  if (filters.projectIds?.length) {
    filters.projectIds.forEach((id) => params.append("projectIds", id))
  }
  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)

  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/kpi/transactions?${params.toString()}`
  )
  return response.data.data
}

export async function fetchKpiUserStats(
  workspaceId: string
): Promise<KpiUserStats> {
  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/kpi/stats`
  )
  return response.data.data
}

export async function fetchKpiAccessibleProjects(
  workspaceId: string
): Promise<KpiAccessibleProject[]> {
  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/kpi/accessible-projects`
  )
  return response.data.data
}

export async function fetchKpiAllProjects(
  workspaceId: string
): Promise<KpiAllProject[]> {
  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/kpi/all-projects`
  )
  return response.data.data
}
