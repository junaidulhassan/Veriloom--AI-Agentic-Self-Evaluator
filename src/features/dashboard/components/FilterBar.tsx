import { useMemo, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { CalendarRange, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Popover } from '@/components/ui/Popover'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Tooltip } from '@/components/ui/Tooltip'
import { getToolConfig } from '@/features/tools/registry'
import { truncate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { rangeOptions, type RangeKey } from '../filters'
import { useRecentConversations, useToolCatalog } from '../hooks'
import { useDashboardFilters, useRefreshStore } from '../useDashboardFilters'

const intervals = [
  { value: '15000', label: 'Every 15s' },
  { value: '30000', label: 'Every 30s' },
  { value: '60000', label: 'Every 1m' },
  { value: '300000', label: 'Every 5m' },
]

function CustomRange({
  from,
  to,
  onApply,
}: {
  from?: string
  to?: string
  onApply: (from: string, to: string) => void
}) {
  const [start, setStart] = useState(from ?? format(new Date(Date.now() - 6 * 86400000), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(to ?? format(new Date(), 'yyyy-MM-dd'))
  const invalid = Boolean(start && end && start > end)
  return (
    <div className="w-64 space-y-3">
      <div className="text-ink-muted text-xs font-bold tracking-wider uppercase">Custom range</div>
      <label className="block text-xs font-semibold">
        From
        <Input
          type="date"
          value={start}
          max={end}
          onChange={(event) => setStart(event.target.value)}
          className="mt-1"
        />
      </label>
      <label className="block text-xs font-semibold">
        To
        <Input
          type="date"
          value={end}
          min={start}
          onChange={(event) => setEnd(event.target.value)}
          className="mt-1"
        />
      </label>
      {invalid ? <p className="text-error text-xs">Start must be before end.</p> : null}
      <Button size="sm" className="w-full" disabled={invalid || !start} onClick={() => onApply(start, end)}>
        Apply range
      </Button>
    </div>
  )
}

export function FilterBar() {
  const { filters, update, pending } = useDashboardFilters()
  const { autoRefresh, interval, setAutoRefresh, setInterval } = useRefreshStore()
  const queryClient = useQueryClient()
  const fetching = useIsFetching({ queryKey: ['dashboard'] }) > 0
  const sessions = useRecentConversations(200)
  const tools = useToolCatalog()
  const [customOpen, setCustomOpen] = useState(false)

  const sessionOptions = useMemo(
    () => [
      { value: 'all', label: 'All sessions' },
      ...(sessions.data ?? []).map((item) => ({
        value: item.id,
        label: truncate(item.title || item.id, 36),
      })),
    ],
    [sessions.data],
  )
  const toolOptions = useMemo(
    () => [
      { value: 'all', label: 'All tools' },
      ...(tools.data ?? []).map((item) => ({ value: item.name, label: getToolConfig(item.name).label })),
    ],
    [tools.data],
  )

  return (
    <div
      className={cn(
        'glass relative z-30 flex flex-wrap items-center gap-2 rounded-[var(--radius-panel)] p-2.5 transition-opacity lg:sticky lg:top-[84px]',
        pending && 'opacity-80',
      )}
    >
      <div className="flex items-center gap-2">
        <SegmentedControl<RangeKey>
          label="Date range"
          size="sm"
          value={filters.range}
          onChange={(range) => (range === 'custom' ? setCustomOpen(true) : update({ range }))}
          options={rangeOptions}
        />
        <Popover
          open={customOpen}
          onOpenChange={setCustomOpen}
          align="start"
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label="Pick custom date range">
              <CalendarRange className="size-4" />
            </Button>
          }
        >
          <CustomRange
            from={filters.from}
            to={filters.to}
            onApply={(from, to) => {
              update({ range: 'custom', from, to })
              setCustomOpen(false)
            }}
          />
        </Popover>
        {filters.range === 'custom' && filters.from ? (
          <span className="text-ink-muted hidden font-mono text-[11px] xl:inline">
            {filters.from} → {filters.to ?? 'now'}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Session filter"
          size="sm"
          className="w-44"
          value={filters.session ?? 'all'}
          onValueChange={(value) => update({ session: value === 'all' ? undefined : value })}
          options={sessionOptions}
        />
        <Select
          label="Tool filter"
          size="sm"
          className="w-44"
          value={filters.tool ?? 'all'}
          onValueChange={(value) => update({ tool: value === 'all' ? undefined : value })}
          options={toolOptions}
        />
        {filters.session || filters.tool ? (
          <Tooltip content="Session and tool filters apply to tables, tool cards and the heatmap. Aggregate metrics follow the date range.">
            <span
              className="bg-charcoal-900/[0.07] text-ink-soft inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold"
              tabIndex={0}
            >
              <SlidersHorizontal className="size-3" aria-hidden />
              Scoped
            </span>
          </Tooltip>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="text-ink-soft flex items-center gap-2 text-xs font-semibold">
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} label="Auto refresh" />
          <span className="hidden sm:inline">Auto</span>
        </label>
        {autoRefresh ? (
          <Select
            label="Refresh interval"
            size="sm"
            className="w-32"
            value={String(interval)}
            onValueChange={(value) => setInterval(Number(value))}
            options={intervals}
          />
        ) : null}
        <Button
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={cn('size-3.5', fetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>
    </div>
  )
}
