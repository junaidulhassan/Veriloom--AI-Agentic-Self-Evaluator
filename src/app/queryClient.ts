import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { describeError, toApiError } from '@/api/errors'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined)
        toast.error(`Background refresh failed: ${describeError(error)}`, { id: 'bg-refresh' })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.silent) return
      toast.error(describeError(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => {
        const err = toApiError(error)
        if (err.status >= 400 && err.status < 500) return false
        return count < 1
      },
    },
    mutations: { retry: false },
  },
})

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { silent?: boolean }
  }
}
