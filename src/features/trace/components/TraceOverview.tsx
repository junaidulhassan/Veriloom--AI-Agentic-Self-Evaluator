import { memo } from 'react'
import { BoolBadge, StatusBadge } from '@/components/ui/Badge'
import { formatDateTime, formatDuration, formatNumber, shortId } from '@/lib/format'
import type { ExecutionTrace } from '@/types/api'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-strong rounded-xl px-3 py-2">
      <div className="text-ink-muted text-[10.5px] font-bold tracking-wider uppercase">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export const TraceOverview = memo(function TraceOverview({ trace }: { trace: ExecutionTrace }) {
  const { request, summary } = trace
  const total = Math.max(1, summary.llm_time_ms + summary.tool_time_ms + summary.evaluation_time_ms)
  const parts = [
    { label: 'LLM', value: summary.llm_time_ms, color: 'var(--series-2)' },
    { label: 'Tools', value: summary.tool_time_ms, color: 'var(--series-3)' },
    { label: 'Evaluation', value: summary.evaluation_time_ms, color: 'var(--series-1)' },
  ]
  return (
    <div className="space-y-3">
      <div className="bg-surface-strong/70 rounded-2xl p-3">
        <div className="text-ink-muted text-[10.5px] font-bold tracking-wider uppercase">Question</div>
        <p className="mt-1 text-[13px] leading-snug font-semibold">{request.question}</p>
        <div className="text-ink-muted mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <StatusBadge status={request.status} />
          <span className="font-mono">req {shortId(request.id)}</span>
          <span>· {formatDateTime(request.created_at, 'MMM d, HH:mm:ss')}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Latency" value={formatDuration(request.latency_ms)} />
        <Stat label="Tokens" value={formatNumber(request.total_tokens)} />
        <Stat
          label="Tool calls"
          value={`${summary.tool_calls}${summary.failed_tool_calls ? ` (${summary.failed_tool_calls} failed)` : ''}`}
        />
        <Stat label="Attempts" value={String(request.attempts)} />
      </div>
      <div>
        <div className="text-ink-muted mb-1.5 flex justify-between text-[11px] font-semibold">
          <span>Time split</span>
          <span className="font-mono">{summary.llm_calls} LLM calls</span>
        </div>
        <div
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label="Time split between LLM, tools and evaluation"
        >
          {parts.map((part) => (
            <div
              key={part.label}
              style={{ width: `${(part.value / total) * 100}%`, background: part.color }}
              className="min-w-[3px] first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
        <div className="text-ink-soft mt-1.5 flex flex-wrap gap-3 text-[11px]">
          {parts.map((part) => (
            <span key={part.label} className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ background: part.color }} aria-hidden />
              {part.label} {formatDuration(part.value)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1">
          Correct <BoolBadge value={request.is_correct} />
        </span>
        <span className="inline-flex items-center gap-1">
          Hallucination <BoolBadge value={request.is_hallucination} invert />
        </span>
        <span className="inline-flex items-center gap-1">
          Relevant <BoolBadge value={request.is_relevant} />
        </span>
        <span className="inline-flex items-center gap-1">
          Self-corrected <BoolBadge value={request.self_corrected} trueLabel="Yes" falseLabel="No" />
        </span>
      </div>
    </div>
  )
})
