import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  dashboardApi,
  type EvaluationFilters,
  type RequestFilters,
  type ToolExecutionFilters,
} from '@/api/dashboard'
import { adminApi } from '@/api/admin'
import { qk } from '@/api/keys'
import { systemApi } from '@/api/system'
import type { TimeWindowParams, TokenGroupBy } from '@/types/api'
import { useDashboardFilters, useRefetchInterval } from './useDashboardFilters'

function useWindowQuery<T>(
  section: string,
  fn: (w: TimeWindowParams) => Promise<T>,
  extra?: unknown,
  enabled = true,
) {
  const { window } = useDashboardFilters()
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: qk.dashboard(section, window, extra),
    queryFn: () => fn(window),
    refetchInterval,
    placeholderData: keepPreviousData,
    enabled,
  })
}

export const useOverview = () => useWindowQuery('overview', dashboardApi.overview)

export function usePreviousOverview() {
  const { previous } = useDashboardFilters()
  return useQuery({
    queryKey: qk.dashboard('overview', previous ?? {}, 'previous'),
    queryFn: () => dashboardApi.overview(previous ?? {}),
    enabled: Boolean(previous),
    staleTime: 5 * 60_000,
  })
}

export const useTimeseries = () => useWindowQuery('timeseries', dashboardApi.timeseries)
export const useResponseQuality = () => useWindowQuery('response-quality', dashboardApi.responseQuality)
export const useAgentPerformance = () => useWindowQuery('agent-performance', dashboardApi.agentPerformance)
export const useToolStats = () => useWindowQuery('tools', dashboardApi.tools)
export const useToolDetail = (name: string) =>
  useWindowQuery('tool-detail', (w) => dashboardApi.toolDetail(name, w), name)
export const useTokens = () => useWindowQuery('tokens', dashboardApi.tokens)
export const useTokenBreakdown = (groupBy: TokenGroupBy, limit = 15) =>
  useWindowQuery('token-breakdown', (w) => dashboardApi.tokenBreakdown(groupBy, w, limit), { groupBy, limit })
export const useLatency = () => useWindowQuery('latency', dashboardApi.latency)
export const useErrors = () => useWindowQuery('errors', dashboardApi.errors)
export const useHallucinations = () =>
  useWindowQuery('hallucinations', (w) => dashboardApi.hallucinations(w, 50))
export const useRag = () => useWindowQuery('rag', dashboardApi.rag)
export const useActivity = () => useWindowQuery('activity', dashboardApi.activity)

export function useRecentErrors(page: number, category?: string) {
  return useWindowQuery(
    'recent-errors',
    (w) => dashboardApi.recentErrors({ ...w, page, page_size: 10, category }),
    { page, category },
  )
}

export function useRequests(filters: RequestFilters, key = 'requests') {
  return useWindowQuery(key, (w) => dashboardApi.requests({ ...w, ...filters }), filters)
}

export function useToolExecutions(filters: ToolExecutionFilters, key = 'tool-executions') {
  return useWindowQuery(key, (w) => dashboardApi.toolExecutions({ ...w, ...filters }), filters)
}

export function useEvaluations(filters: EvaluationFilters) {
  return useWindowQuery('evaluations', (w) => dashboardApi.evaluations({ ...w, ...filters }), filters)
}

export function useRagDocuments() {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'rag-documents'],
    queryFn: dashboardApi.ragDocuments,
    refetchInterval,
  })
}

export function useChunkStats() {
  const refetchInterval = useRefetchInterval()
  return useQuery({ queryKey: ['dashboard', 'rag-chunks'], queryFn: dashboardApi.ragChunks, refetchInterval })
}

export function useRecentConversations(limit = 100) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'recent-conversations', limit],
    queryFn: () => dashboardApi.recentConversations(limit),
    refetchInterval,
  })
}

export function useToolCatalog() {
  return useQuery({ queryKey: qk.tools, queryFn: systemApi.tools, staleTime: 5 * 60_000 })
}

export function useCodeExecutions(page: number, status?: string) {
  const { window } = useDashboardFilters()
  return useQuery({
    queryKey: qk.admin('code-executions', { window, page, status }),
    queryFn: () => adminApi.codeExecutions({ ...window, page, page_size: 8, status }),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useSelfCorrections(page: number) {
  const { window } = useDashboardFilters()
  return useQuery({
    queryKey: qk.admin('self-corrections', { window, page }),
    queryFn: () => adminApi.selfCorrections({ ...window, page, page_size: 5 }),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
