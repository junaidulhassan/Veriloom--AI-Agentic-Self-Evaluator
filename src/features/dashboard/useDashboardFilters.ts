import { useCallback, useMemo, useTransition } from 'react'
import { useSearchParams } from 'react-router'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseFilters, previousWindow, resolveWindow, type DashboardFilters } from './filters'

interface RefreshState {
  autoRefresh: boolean
  interval: number
  setAutoRefresh: (value: boolean) => void
  setInterval: (value: number) => void
}

export const useRefreshStore = create<RefreshState>()(
  persist(
    (set) => ({
      autoRefresh: false,
      interval: 30_000,
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setInterval: (interval) => set({ interval }),
    }),
    { name: 'veriloom.dashboard.refresh' },
  ),
)

export function useRefetchInterval() {
  const { autoRefresh, interval } = useRefreshStore()
  return autoRefresh ? interval : false
}

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()
  const [pending, startTransition] = useTransition()
  const filters = useMemo(() => parseFilters(params), [params])
  const window = useMemo(() => resolveWindow(filters), [filters])
  const previous = useMemo(() => previousWindow(window), [window])

  const update = useCallback(
    (patch: Partial<DashboardFilters>) => {
      startTransition(() => {
        setParams(
          (current) => {
            const next = new URLSearchParams(current)
            Object.entries(patch).forEach(([key, value]) => {
              if (value == null || value === '') next.delete(key)
              else next.set(key, String(value))
            })
            if (patch.range && patch.range !== 'custom') {
              next.delete('from')
              next.delete('to')
            }
            return next
          },
          { replace: true, preventScrollReset: true },
        )
      })
    },
    [setParams],
  )

  return { filters, window, previous, update, pending, params }
}
