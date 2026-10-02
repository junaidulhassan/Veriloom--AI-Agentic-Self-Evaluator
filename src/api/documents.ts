import type { AxiosProgressEvent } from 'axios'
import type {
  ChunkDeleteResponse,
  ChunkDetail,
  ChunkOut,
  DocumentDeleteResponse,
  DocumentDetail,
  DocumentOut,
  IndexStatus,
  Page,
  PageParams,
  ReindexResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  UploadResponse,
} from '@/types/api'
import { env } from '@/lib/env'
import { cleanParams, del, get, post } from './client'

export const documentsApi = {
  list: (params: PageParams & { search?: string; status?: string } = {}) =>
    get<Page<DocumentOut>>('/documents', { params: cleanParams(params) }),
  upload: (files: File[], onProgress?: (event: AxiosProgressEvent) => void, signal?: AbortSignal) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return post<UploadResponse>('/documents', form, {
      onUploadProgress: onProgress,
      signal,
      timeout: env.chatTimeoutMs,
    })
  },
  detail: (id: string) => get<DocumentDetail>(`/documents/${id}`),
  fileUrl: (id: string) => `${env.apiBaseUrl}/documents/${id}/file`,
  chunks: (id: string, params: PageParams & { page_number?: number; include_text?: boolean } = {}) =>
    get<Page<ChunkOut>>(`/documents/${id}/chunks`, { params: cleanParams(params) }),
  chunk: (chunkId: number, includeVector = false) =>
    get<ChunkDetail>(`/documents/chunks/${chunkId}`, { params: { include_vector: includeVector } }),
  keywordSearch: (params: PageParams & { q: string; document_id?: string }) =>
    get<Page<ChunkOut>>('/documents/chunks/search', { params: cleanParams(params) }),
  semanticSearch: (payload: SemanticSearchRequest) =>
    post<SemanticSearchResponse>('/documents/search', payload),
  indexStatus: () => get<IndexStatus>('/documents/index/status'),
  remove: (id: string) => del<DocumentDeleteResponse>(`/documents/${id}`),
  removeChunk: (chunkId: number) => del<ChunkDeleteResponse>(`/documents/chunks/${chunkId}`),
  reindexAll: () =>
    post<ReindexResponse>('/documents/reindex', undefined, { timeout: env.chatTimeoutMs * 2 }),
  reindexDocument: (id: string) =>
    post<ReindexResponse>(`/documents/${id}/reindex`, undefined, { timeout: env.chatTimeoutMs * 2 }),
}
