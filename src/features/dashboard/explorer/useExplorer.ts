import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { documentsApi } from '@/api/documents'
import { qk } from '@/api/keys'
import type { ChunkOut, Page } from '@/types/api'

export function useDocumentDetail(id: string | null) {
  return useQuery({
    queryKey: qk.document(id ?? ''),
    queryFn: () => documentsApi.detail(id as string),
    enabled: Boolean(id),
  })
}

export function useAllChunks(id: string | null) {
  const query = useInfiniteQuery({
    queryKey: qk.documentChunks(id ?? ''),
    queryFn: ({ pageParam }) =>
      documentsApi.chunks(id as string, { page: pageParam, page_size: 200, include_text: true }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    enabled: Boolean(id),
  })
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  const chunks = query.data?.pages.flatMap((page) => page.items) ?? []
  return { ...query, chunks, total: query.data?.pages[0]?.total ?? 0 }
}

export function useChunkDetail(chunkId: number | null) {
  return useQuery({
    queryKey: qk.chunk(chunkId ?? -1),
    queryFn: () => documentsApi.chunk(chunkId as number),
    enabled: chunkId != null,
    staleTime: 60_000,
  })
}

export function useChunkSearch(q: string, documentId?: string) {
  return useQuery({
    queryKey: qk.chunkSearch(q, documentId),
    queryFn: () => documentsApi.keywordSearch({ q, document_id: documentId, page_size: 100 }),
    enabled: q.trim().length > 1,
    placeholderData: (previous) => previous,
  })
}

export function useIndexStatus() {
  return useQuery({ queryKey: qk.indexStatus, queryFn: documentsApi.indexStatus, refetchInterval: 30_000 })
}

export function useDeleteChunk(documentId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chunkId: number) => documentsApi.removeChunk(chunkId),
    onMutate: async (chunkId) => {
      const key = qk.documentChunks(documentId ?? '')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<{ pages: Page<ChunkOut>[]; pageParams: unknown[] }>(key)
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== chunkId),
            total: page.total - 1,
          })),
        })
      }
      return { previous, key }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
    },
    onSuccess: (result) => toast.success(`Chunk deleted · ${result.remaining_chunks} remaining`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.documentsRoot })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useReindex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId?: string) =>
      documentId ? documentsApi.reindexDocument(documentId) : documentsApi.reindexAll(),
    onSuccess: (result) =>
      toast.success(
        `Re-indexed ${result.reindexed_chunks} chunks in ${(result.duration_ms / 1000).toFixed(1)}s · index size ${result.index_size}`,
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.documentsRoot })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
