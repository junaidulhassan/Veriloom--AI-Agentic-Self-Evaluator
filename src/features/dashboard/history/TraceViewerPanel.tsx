import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Waypoints } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, SearchInput } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import { formatDateTime, formatDuration, truncate } from '@/lib/format'
import { useRequests } from '../hooks'
import { useDashboardFilters } from '../useDashboardFilters'
import { TraceDetail } from './TraceViewerContext'

export function TraceViewerPanel() {
  const [params, setParams] = useSearchParams()
  const { filters } = useDashboardFilters()
  const selected = params.get('trace')
  const [manual, setManual] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 350)
  const requests = useRequests(
    { page_size: 40, conversation_id: filters.session, search: debounced || undefined },
    'trace-requests',
  )
  const items = useMemo(() => requests.data?.items ?? [], [requests.data])
  const select = (id: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (id) next.set('trace', id)
        else next.delete('trace')
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (manual.trim()) select(manual.trim())
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste a request ID"
            aria-label="Request ID"
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Open
          </Button>
        </form>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search questions"
          pending={requests.isFetching}
        />
        <ul className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
          {requests.isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-14" />
                </li>
              ))
            : null}
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => select(item.id)}
                className={cn(
                  'w-full rounded-xl px-3 py-2 text-left transition-colors',
                  selected === item.id
                    ? 'bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900'
                    : 'hover:bg-charcoal-900/[0.06] dark:hover:bg-cream/5',
                )}
              >
                <div className="line-clamp-1 text-[13px] font-semibold">{truncate(item.question, 70)}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] opacity-75">
                  <StatusBadge status={item.status} />
                  <span>{formatDuration(item.latency_ms)}</span>·<span>{item.tool_call_count} tools</span>·
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
              </button>
            </li>
          ))}
          {!requests.isPending && !items.length ? (
            <li>
              <EmptyState compact title="No requests found" />
            </li>
          ) : null}
        </ul>
      </div>
      <div className="border-line bg-surface-strong/40 min-w-0 rounded-2xl border p-4">
        {selected ? (
          <TraceDetail requestId={selected} />
        ) : (
          <EmptyState
            icon={<Waypoints className="size-6" aria-hidden />}
            title="Pick a request"
            description="Every reasoning step, tool call, evaluation and retry is replayed with the same timeline used in the chat."
          />
        )}
      </div>
    </div>
  )
}
