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

export const workspaceApi = {
  system: () => get<SystemInfo>('/workspace/system', { retries: 0 }),
  trace: (requestId: string) => get<ExecutionTrace>(`/workspace/requests/${requestId}/trace`),
  codeExecutions: (params: P & { status?: string; request_id?: string }) =>
    get<Page<CodeExecutionOut>>('/workspace/code-executions', { params: cleanParams(params) }),
  selfCorrections: (params: P & { successful_only?: boolean }) =>
    get<Page<RequestEvaluationTrail>>('/workspace/self-corrections', { params: cleanParams(params) }),
  hallucinatedResponses: (params: P & { final_only?: boolean }) =>
    get<Page<RequestEvaluationTrail>>('/workspace/hallucinations', { params: cleanParams(params) }),
  clearRequests: (body: RequestDeleteRequest) => post<DeleteResult>('/workspace/requests/clear', body),
  clearEvaluations: (body: EvaluationDeleteRequest) =>
    post<DeleteResult>('/workspace/evaluations/clear', body),
  clearConversations: (body: ConversationClearRequest) =>
    post<DeleteResult>('/workspace/conversations/clear', body),
  clearErrors: (body: ErrorClearRequest) => post<DeleteResult>('/workspace/errors/clear', body),
  clearCodeExecutions: (body: CodeExecutionClearRequest) =>
    post<DeleteResult>('/workspace/code-executions/clear', body),
  clearRetrievals: (body: RetrievalClearRequest) => post<DeleteResult>('/workspace/retrievals/clear', body),
  resetMetrics: (body: ResetMetricsRequest) => post<DeleteResult>('/workspace/metrics/reset', body),
  reindex: (documentId?: string) =>
    post<ReindexResponse>('/workspace/reindex', undefined, {
      params: cleanParams({ document_id: documentId }),
      timeout: env.chatTimeoutMs * 2,
    }),
}
