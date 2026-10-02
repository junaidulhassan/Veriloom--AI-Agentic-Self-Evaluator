import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { toast } from 'sonner'
import { documentsApi } from '@/api/documents'
import { describeError } from '@/api/errors'
import { qk } from '@/api/keys'
import type { DocumentOut, Page } from '@/types/api'

export type UploadPhase = 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexed' | 'error'

export interface UploadItem {
  id: string
  name: string
  size: number
  phase: UploadPhase
  progress: number
  error?: string
  documentId?: string
  chunks?: number
}

interface UploadState {
  items: UploadItem[]
  upsert: (items: UploadItem[]) => void
  patch: (ids: string[], patch: Partial<UploadItem> | ((item: UploadItem) => Partial<UploadItem>)) => void
  dismiss: (id: string) => void
  clearFinished: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  items: [],
  upsert: (items) => set((state) => ({ items: [...items, ...state.items] })),
  patch: (ids, patch) =>
    set((state) => ({
      items: state.items.map((item) =>
        ids.includes(item.id) ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) } : item,
      ),
    })),
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clearFinished: () =>
    set((state) => ({
      items: state.items.filter((item) => item.phase !== 'indexed' && item.phase !== 'error'),
    })),
}))

export const MAX_UPLOAD_MB = 25

export function validatePdf(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Only PDF files are supported.'
  if (file.size === 0) return 'This file is empty.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds the ${MAX_UPLOAD_MB} MB limit.`
  return null
}

const friendlyUploadError = (code: string, message: string) => {
  if (code === 'invalid_pdf') return `Invalid or corrupted PDF: ${message}`
  if (code === 'empty_document') return 'No extractable text found. The PDF may be scanned images or empty.'
  if (code === 'conflict') return `Already uploaded: ${message}`
  return message
}

export function useDocuments(search = '') {
  return useQuery({
    queryKey: qk.documents(search),
    queryFn: () => documentsApi.list({ page_size: 100, search: search || undefined }),
    placeholderData: (previous) => previous,
  })
}

export function useUploadDocuments() {
  const queryClient = useQueryClient()
  const { upsert, patch } = useUploadStore()

  return useCallback(
    async (files: File[]) => {
      if (!files.length) return
      const stamp = Date.now().toString(36)
      const entries: UploadItem[] = files.map((file, index) => ({
        id: `${stamp}-${index}`,
        name: file.name,
        size: file.size,
        phase: 'uploading',
        progress: 0,
      }))
      const invalid = entries.filter((_, index) => validatePdf(files[index]))
      invalid.forEach((entry) => {
        const file = files[entries.indexOf(entry)]
        entry.phase = 'error'
        entry.error = validatePdf(file) ?? undefined
      })
      upsert(entries)
      const valid = files.filter((file) => !validatePdf(file))
      const ids = entries.filter((entry) => entry.phase !== 'error').map((entry) => entry.id)
      if (!valid.length) {
        toast.error('No valid PDF files to upload')
        return
      }
      const phases: UploadPhase[] = ['extracting', 'chunking', 'embedding']
      let timer: ReturnType<typeof setInterval> | null = null
      try {
        const response = await documentsApi.upload(valid, (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 50
          patch(ids, { progress })
          if (progress >= 100 && !timer) {
            let step = 0
            patch(ids, { phase: phases[0] })
            timer = setInterval(() => {
              step = Math.min(step + 1, phases.length - 1)
              patch(ids, (item) =>
                item.phase === 'error' || item.phase === 'indexed' ? {} : { phase: phases[step] },
              )
            }, 1400)
          }
        })
        const byName = new Map(response.uploaded.map((doc) => [doc.filename, doc]))
        const failed = new Map(response.failed.map((item) => [item.filename, item]))
        patch(ids, (item) => {
          const doc = byName.get(item.name)
          if (doc) return { phase: 'indexed', progress: 100, documentId: doc.id, chunks: doc.chunk_count }
          const failure = failed.get(item.name)
          return {
            phase: 'error',
            error: failure ? friendlyUploadError(failure.code, failure.message) : 'Upload failed',
          }
        })
        if (response.uploaded.length)
          toast.success(
            `Indexed ${response.uploaded.length} document${response.uploaded.length > 1 ? 's' : ''}`,
          )
        if (response.failed.length)
          toast.error(
            `${response.failed.length} file${response.failed.length > 1 ? 's' : ''} could not be processed`,
          )
      } catch (error) {
        patch(ids, { phase: 'error', error: describeError(error) })
        toast.error(describeError(error))
      } finally {
        if (timer) clearInterval(timer)
        queryClient.invalidateQueries({ queryKey: qk.documentsRoot })
        queryClient.invalidateQueries({ queryKey: qk.dashboardRoot })
      }
    },
    [patch, queryClient, upsert],
  )
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['documents', 'list'] })
      const snapshot = queryClient.getQueriesData<Page<DocumentOut>>({ queryKey: ['documents', 'list'] })
      snapshot.forEach(([key, data]) => {
        if (data)
          queryClient.setQueryData<Page<DocumentOut>>(key, {
            ...data,
            items: data.items.filter((item) => item.id !== id),
            total: Math.max(0, data.total - 1),
          })
      })
      return { snapshot }
    },
    onError: (_error, _id, context) =>
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSuccess: (result) => toast.success(`Document deleted (${result.deleted_chunks} chunks removed)`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.documentsRoot })
      queryClient.invalidateQueries({ queryKey: qk.dashboardRoot })
    },
  })
}
