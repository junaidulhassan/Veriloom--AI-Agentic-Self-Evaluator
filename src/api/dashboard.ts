import type {
  ActivityStats,
  AgentPerformanceStats,
  AgentRequestOut,
  ChunkStats,
  DocumentStatsRow,
  ErrorLogOut,
  ErrorStats,
  EvaluationHistoryItem,
  HallucinationStats,
  LatencyStats,
  OverviewStats,
  Page,
  PageParams,
  RagStats,
  RecentConversation,
  ResponseQualityStats,
  RetrievalOut,
  TimeWindowParams,
  TimeseriesPoint,
  TokenGroupBy,
  TokenGroupRow,
  TokenSummary,
  TokenUsageOut,
  ToolDetail,
  ToolExecutionOut,
  ToolStats,
} from '@/types/api'
import { cleanParams, get } from './client'

type W = TimeWindowParams

export interface RequestFilters extends W, PageParams {
  status?: string
  is_correct?: boolean
  is_hallucination?: boolean
  self_corrected?: boolean
  conversation_id?: string
  search?: string
}

export interface ToolExecutionFilters extends W, PageParams {
  tool_name?: string
  status?: 'success' | 'error'
  error_type?: string
  request_id?: string
}

export interface EvaluationFilters extends W, PageParams {
  is_final?: boolean
  is_correct?: boolean
  is_hallucination?: boolean
  needs_retry?: boolean
  request_id?: string
}

const q = <T extends object>(params?: T) => ({ params: cleanParams(params) })

export const dashboardApi = {
  overview: (w: W) => get<OverviewStats>('/dashboard/overview', q(w)),
  responseQuality: (w: W) => get<ResponseQualityStats>('/dashboard/response-quality', q(w)),
  agentPerformance: (w: W) => get<AgentPerformanceStats>('/dashboard/agent-performance', q(w)),
  tools: (w: W) => get<ToolStats[]>('/dashboard/tools', q(w)),
  toolDetail: (name: string, w: W) => get<ToolDetail>(`/dashboard/tools/${encodeURIComponent(name)}`, q(w)),
  tokens: (w: W) => get<TokenSummary>('/dashboard/tokens', q(w)),
  tokenBreakdown: (groupBy: TokenGroupBy, w: W, limit = 20) =>
    get<TokenGroupRow[]>('/dashboard/tokens/breakdown', q({ ...w, group_by: groupBy, limit })),
  tokenRecords: (
    params: W & PageParams & { component?: string; request_id?: string; conversation_id?: string },
  ) => get<Page<TokenUsageOut>>('/dashboard/tokens/records', q(params)),
  latency: (w: W) => get<LatencyStats>('/dashboard/latency', q(w)),
  errors: (w: W) => get<ErrorStats>('/dashboard/errors', q(w)),
  recentErrors: (params: W & PageParams & { category?: string; source?: string }) =>
    get<Page<ErrorLogOut>>('/dashboard/errors/recent', q(params)),
  hallucinations: (w: W, limit = 50) =>
    get<HallucinationStats>('/dashboard/hallucinations', q({ ...w, limit })),
  rag: (w: W) => get<RagStats>('/dashboard/rag', q(w)),
  ragDocuments: () => get<DocumentStatsRow[]>('/dashboard/rag/documents'),
  ragChunks: () => get<ChunkStats>('/dashboard/rag/chunks'),
  retrievals: (
    params: W & PageParams & { source?: 'agent' | 'api'; success?: boolean; request_id?: string },
  ) => get<Page<RetrievalOut>>('/dashboard/rag/retrievals', q(params)),
  timeseries: (w: W) => get<TimeseriesPoint[]>('/dashboard/timeseries', q(w)),
  activity: (w: W) => get<ActivityStats>('/dashboard/activity', q(w)),
  recentConversations: (limit = 50) =>
    get<RecentConversation[]>('/dashboard/conversations/recent', q({ limit })),
  requests: (params: RequestFilters) => get<Page<AgentRequestOut>>('/dashboard/requests', q(params)),
  toolExecutions: (params: ToolExecutionFilters) =>
    get<Page<ToolExecutionOut>>('/dashboard/tool-executions', q(params)),
  evaluations: (params: EvaluationFilters) =>
    get<Page<EvaluationHistoryItem>>('/dashboard/evaluations', q(params)),
}
