import type { TimeWindowParams } from '@/types/api'

type W = TimeWindowParams

export const qk = {
  tools: ['system', 'tools'] as const,
  me: ['auth', 'me'] as const,
  account: ['auth', 'account'] as const,
  systemInfo: ['workspace', 'system'] as const,
  conversations: (search?: string) => ['chat', 'conversations', search ?? ''] as const,
  conversationsRoot: ['chat', 'conversations'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  trace: (requestId: string) => ['chat', 'trace', requestId] as const,
  documents: (search?: string) => ['documents', 'list', search ?? ''] as const,
  documentsRoot: ['documents'] as const,
  document: (id: string) => ['documents', 'detail', id] as const,
  documentChunks: (id: string) => ['documents', 'chunks', id] as const,
  chunk: (id: number) => ['documents', 'chunk', id] as const,
  chunkSearch: (q: string, documentId?: string) =>
    ['documents', 'chunk-search', q, documentId ?? ''] as const,
  indexStatus: ['documents', 'index'] as const,
  dashboard: (section: string, w: W, extra?: unknown) =>
    ['dashboard', section, w.start ?? '', w.end ?? '', extra ?? null] as const,
  dashboardRoot: ['dashboard'] as const,
  workspace: (section: string, extra?: unknown) => ['workspace', section, extra ?? null] as const,
}
