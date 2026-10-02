import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'
import { qk } from '@/api/keys'
import { traceToState } from '@/features/trace/fromTrace'
import type { ExecutionTrace, Source } from '@/types/api'
import { useMaxAttempts } from './useMaxAttempts'

export function useAgentTrace(requestId: string | null | undefined, options: { enabled?: boolean } = {}) {
  const maxAttempts = useMaxAttempts()
  const query = useQuery({
    queryKey: qk.trace(requestId ?? ''),
    queryFn: () => chatApi.trace(requestId as string),
    enabled: Boolean(requestId) && (options.enabled ?? true),
    staleTime: (q) => (q.state.data?.request.status === 'running' ? 0 : Infinity),
    refetchInterval: (q) => (q.state.data?.request.status === 'running' ? 2000 : false),
  })
  const state = useMemo(
    () => (query.data ? traceToState(query.data, maxAttempts) : null),
    [query.data, maxAttempts],
  )
  return { ...query, state }
}

export function sourcesFromTrace(trace: ExecutionTrace | undefined): Source[] {
  if (!trace) return []
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const execution of trace.tool_executions) {
    const list = (execution.output_metadata?.sources as Source[] | undefined) ?? []
    for (const source of list) {
      const key = `${source.url ?? ''}|${source.chunk_id ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      sources.push(source)
    }
  }
  return sources
}
