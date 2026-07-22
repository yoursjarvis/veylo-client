import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  fetchKpiAccessibleProjects,
  fetchKpiAllProjects,
  fetchKpiLeaderboard,
  fetchKpiTransactions,
  fetchKpiUserStats,
} from "./api"

const KPI_PAGE_LIMIT = 20

type KpiQueryFilters = {
  userId?: string
  projectIds?: string[]
  startDate?: string
  endDate?: string
}

export function useKpiLeaderboard(
  workspaceId: string,
  filters: Omit<KpiQueryFilters, "userId"> = {}
) {
  return useQuery({
    queryKey: ["kpi-leaderboard", workspaceId, filters],
    queryFn: () => fetchKpiLeaderboard(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useKpiTransactionsInfinite(
  workspaceId: string,
  filters: KpiQueryFilters = {}
) {
  return useInfiniteQuery({
    queryKey: ["kpi-transactions", workspaceId, filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchKpiTransactions(
        workspaceId,
        pageParam as number,
        KPI_PAGE_LIMIT,
        filters
      ),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.pagination.page + 1
      return nextPage <= lastPage.pagination.totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useKpiUserStats(workspaceId: string) {
  return useQuery({
    queryKey: ["kpi-user-stats", workspaceId],
    queryFn: () => fetchKpiUserStats(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}

export function useKpiAccessibleProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["kpi-accessible-projects", workspaceId],
    queryFn: () => fetchKpiAccessibleProjects(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}

export function useKpiAllProjects(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["kpi-all-projects", workspaceId],
    queryFn: () => fetchKpiAllProjects(workspaceId),
    enabled: !!workspaceId && enabled,
    staleTime: 60_000,
  })
}
