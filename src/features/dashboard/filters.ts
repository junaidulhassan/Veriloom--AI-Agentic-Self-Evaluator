import { endOfDay, startOfDay, subDays } from 'date-fns'
import type { TimeWindowParams } from '@/types/api'

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom'

export interface DashboardFilters {
  range: RangeKey
  from?: string
  to?: string
  session?: string
  tool?: string
}

export const rangeOptions: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' },
]

export const DEFAULT_RANGE: RangeKey = '30d'

const ranges: RangeKey[] = ['today', '7d', '30d', '90d', 'all', 'custom']

export function parseFilters(params: URLSearchParams): DashboardFilters {
  const range = params.get('range') as RangeKey | null
  return {
    range: range && ranges.includes(range) ? range : DEFAULT_RANGE,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    session: params.get('session') ?? undefined,
    tool: params.get('tool') ?? undefined,
  }
}

function minuteFloor(date: Date) {
  const copy = new Date(date)
  copy.setSeconds(0, 0)
  return copy
}

export function resolveWindow(
  filters: Pick<DashboardFilters, 'range' | 'from' | 'to'>,
  now = new Date(),
): TimeWindowParams {
  const end = endOfDay(now)
  switch (filters.range) {
    case 'today':
      return { start: startOfDay(now).toISOString(), end: end.toISOString() }
    case '7d':
      return { start: startOfDay(subDays(now, 6)).toISOString(), end: end.toISOString() }
    case '30d':
      return { start: startOfDay(subDays(now, 29)).toISOString(), end: end.toISOString() }
    case '90d':
      return { start: startOfDay(subDays(now, 89)).toISOString(), end: end.toISOString() }
    case 'custom': {
      const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null
      const to = filters.to ? new Date(`${filters.to}T00:00:00`) : null
      return {
        start: from && !Number.isNaN(from.getTime()) ? startOfDay(from).toISOString() : undefined,
        end: to && !Number.isNaN(to.getTime()) ? endOfDay(to).toISOString() : minuteFloor(end).toISOString(),
      }
    }
    default:
      return {}
  }
}

export function previousWindow(window: TimeWindowParams): TimeWindowParams | null {
  if (!window.start || !window.end) return null
  const start = new Date(window.start).getTime()
  const end = new Date(window.end).getTime()
  const span = end - start
  return { start: new Date(start - span - 1).toISOString(), end: new Date(start - 1).toISOString() }
}

export function percentChange(current: number | undefined, previous: number | undefined) {
  if (current == null || previous == null) return null
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}
