import { memo } from 'react'
import { ChevronDown, Clock, Coins, Repeat2, Wrench } from 'lucide-react'
import { getToolConfig } from '@/features/tools/registry'
import { formatDuration, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TraceState } from '../types'

export function summarizeTrace(state: TraceState) {
  const tools = state.steps.filter((step) => step.kind === 'tool')
  const names = [...new Set(tools.map((step) => step.toolName ?? 'tool'))]
  const latency = state.response?.latency_ms ?? (state.endedAt ? state.endedAt - state.startedAt : undefined)
  const tokens =
    state.response?.token_usage.total_tokens ?? state.steps.find((step) => step.kind === 'final')?.tokens
  return { toolCount: tools.length, names, latency, tokens, attempts: state.attempt }
}

export const TraceSummaryBar = memo(function TraceSummaryBar({
  state,
  open,
  onToggle,
}: {
  state: TraceState
  open: boolean
  onToggle: () => void
}) {
  const summary = summarizeTrace(state)
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group border-line bg-surface-strong/70 text-ink-soft hover:border-line-strong flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-3 py-2 text-left text-xs transition-colors"
    >
      <span className="flex items-center -space-x-1.5">
        {summary.names.slice(0, 4).map((name) => {
          const config = getToolConfig(name)
          const Icon = config.icon
          return (
            <span
              key={name}
              className="bg-surface-strong grid size-6 place-items-center rounded-full ring-2 ring-[var(--surface-strong)]"
              style={{ color: config.color }}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
          )
        })}
        {!summary.names.length ? (
          <span className="bg-surface-strong text-ink-muted grid size-6 place-items-center rounded-full">
            <Wrench className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </span>
      <span className="text-ink font-semibold">
        {summary.toolCount
          ? `Used ${summary.toolCount} ${summary.toolCount === 1 ? 'tool' : 'tools'}`
          : 'Answered without tools'}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3" aria-hidden />
        {formatDuration(summary.latency)}
      </span>
      {summary.tokens ? (
        <span className="inline-flex items-center gap-1">
          <Coins className="size-3" aria-hidden />
          {formatNumber(summary.tokens)} tokens
        </span>
      ) : null}
      {summary.attempts > 1 ? (
        <span className="inline-flex items-center gap-1">
          <Repeat2 className="size-3" aria-hidden />
          {summary.attempts} attempts
        </span>
      ) : null}
      <ChevronDown
        className={cn('ml-auto size-3.5 transition-transform', !open && '-rotate-90')}
        aria-hidden
      />
    </button>
  )
})
