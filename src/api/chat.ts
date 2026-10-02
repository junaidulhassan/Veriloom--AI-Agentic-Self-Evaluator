import { env } from '@/lib/env'
import type {
  ChatRequest,
  ChatResponse,
  ConversationDetail,
  ConversationOut,
  DeleteResult,
  ExecutionTrace,
  MessageOut,
  Page,
  PageParams,
} from '@/types/api'
import { cleanParams, del, get, patch, post } from './client'

export const chatApi = {
  send: (payload: ChatRequest, signal?: AbortSignal) =>
    post<ChatResponse>('/chat', payload, { signal, timeout: env.chatTimeoutMs }),
  conversations: (params: PageParams & { search?: string } = {}) =>
    get<Page<ConversationOut>>('/chat/conversations', { params: cleanParams(params) }),
  conversation: (id: string) => get<ConversationDetail>(`/chat/conversations/${id}`),
  messages: (id: string) => get<MessageOut[]>(`/chat/conversations/${id}/messages`),
  rename: (id: string, title: string) => patch<ConversationOut>(`/chat/conversations/${id}`, { title }),
  remove: (id: string, purgeRequests = false) =>
    del<DeleteResult>(`/chat/conversations/${id}`, { params: { purge_requests: purgeRequests } }),
  trace: (requestId: string) => get<ExecutionTrace>(`/chat/requests/${requestId}/trace`),
}
