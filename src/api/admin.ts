import type {
  CodeExecutionClearRequest,
  CodeExecutionOut,
  ConversationClearRequest,
  DeleteResult,
  ErrorClearRequest,
  EvaluationDeleteRequest,
  ExecutionTrace,
  Page,
  PageParams,
  ReindexResponse,
  RequestDeleteRequest,
  RequestEvaluationTrail,
  ResetMetricsRequest,
  RetrievalClearRequest,
  SystemInfo,
  TimeWindowParams,
} from '@/types/api'
import { env } from '@/lib/env'
import { cleanParams, get, post } from './client'

type P = TimeWindowParams & PageParams

export const adminApi = {
  system: () => get<SystemInfo>('/admin/system', { retries: 0 }),
  trace: (requestId: string) => get<ExecutionTrace>(`/admin/requests/${requestId}/trace`),
  codeExecutions: (params: P & { status?: string; request_id?: string }) =>
    get<Page<CodeExecutionOut>>('/admin/code-executions', { params: cleanParams(params) }),
  selfCorrections: (params: P & { successful_only?: boolean }) =>
    get<Page<RequestEvaluationTrail>>('/admin/self-corrections', { params: cleanParams(params) }),
  hallucinatedResponses: (params: P & { final_only?: boolean }) =>
    get<Page<RequestEvaluationTrail>>('/admin/hallucinations', { params: cleanParams(params) }),
  clearRequests: (body: RequestDeleteRequest) => post<DeleteResult>('/admin/requests/clear', body),
  clearEvaluations: (body: EvaluationDeleteRequest) => post<DeleteResult>('/admin/evaluations/clear', body),
  clearConversations: (body: ConversationClearRequest) =>
    post<DeleteResult>('/admin/conversations/clear', body),
  clearErrors: (body: ErrorClearRequest) => post<DeleteResult>('/admin/errors/clear', body),
  clearCodeExecutions: (body: CodeExecutionClearRequest) =>
    post<DeleteResult>('/admin/code-executions/clear', body),
  clearRetrievals: (body: RetrievalClearRequest) => post<DeleteResult>('/admin/retrievals/clear', body),
  resetMetrics: (body: ResetMetricsRequest) => post<DeleteResult>('/admin/metrics/reset', body),
  reindex: (documentId?: string) =>
    post<ReindexResponse>('/admin/reindex', undefined, {
      params: cleanParams({ document_id: documentId }),
      timeout: env.chatTimeoutMs * 2,
    }),
}
