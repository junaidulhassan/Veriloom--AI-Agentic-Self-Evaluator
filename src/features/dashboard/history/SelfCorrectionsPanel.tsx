import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Repeat2, Waypoints } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { Skeleton } from '@/components/ui/Skeleton'
import { confidenceColor } from '@/features/trace/components/EvaluationDetail'
import { formatDateTime } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import type { EvaluationOut } from '@/types/api'
import { useSelfCorrections } from '../hooks'
import { useTraceViewer } from './TraceViewerContext'

function AttemptCard({
  evaluation,
  label,
  tone,
}: {
  evaluation: EvaluationOut | undefined
  label: string
  tone: 'before' | 'after'
}) {
  if (!evaluation)
    return (
      <div className="border-line text-ink-muted rounded-2xl border border-dashed p-4 text-xs">
        No evaluation recorded
      </div>
    )
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-2xl border p-4 ${tone === 'before' ? 'border-error/30 bg-error/[0.04]' : 'border-success/30 bg-success/[0.05]'}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge size="xs" tone={tone === 'before' ? 'error' : 'success'}>
          {label} · attempt {evaluation.attempt}
        </Badge>
        <span className="font-mono font-bold" style={{ color: confidenceColor(evaluation.confidence) }}>
          {Math.round(evaluation.confidence * 100)}%
        </span>
        {evaluation.is_hallucination ? (
          <Badge size="xs" tone="error">
            hallucination
          </Badge>
        ) : null}
        {evaluation.is_correct ? (
          <Badge size="xs" tone="success">
            correct
          </Badge>
        ) : (
          <Badge size="xs" tone="warning">
            incorrect
          </Badge>
        )}
      </div>
      <div className="bg-surface-strong max-h-64 overflow-y-auto rounded-xl p-3">
        <Markdown content={evaluation.answer || '_empty answer_'} className="text-[13px]" />
      </div>
      <p className="text-ink-soft text-xs leading-relaxed">
        <span className="font-bold">Evaluator: </span>
        {evaluation.reason}
      </p>
      {evaluation.suggested_fix && tone === 'before' ? (
        <p className="text-ink-muted text-xs">
          <span className="font-bold">Suggested fix: </span>
          {evaluation.suggested_fix}
        </p>
      ) : null}
    </div>
  )
}

export function SelfCorrectionsPanel() {
  const [page, setPage] = useState(1)
  const query = useSelfCorrections(page)
  const openTrace = useTraceViewer()
  const pages = query.data?.pages ?? 1
  if (query.isPending)
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    )
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!query.data?.items.length)
    return (
      <EmptyState
        icon={<Repeat2 className="size-6" aria-hidden />}
        title="No self-corrections yet"
        description="When the evaluator rejects an answer and the agent retries, the before and after attempts appear here side by side."
      />
    )
  return (
    <div className="space-y-4">
      <div className="text-ink-muted flex items-center justify-end gap-2 text-xs">
        {query.data.total} requests with retries · page {page} of {Math.max(1, pages)}
        <Button
          variant="soft"
          size="icon-xs"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          variant="soft"
          size="icon-xs"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
      {query.data.items.map((trail) => {
        const sorted = [...trail.evaluations].sort((a, b) => a.attempt - b.attempt)
        const before = sorted[0]
        const after = sorted.find((e) => e.is_final) ?? sorted.at(-1)
        return (
          <motion.article
            key={trail.request_id}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="border-line bg-surface-strong/50 rounded-[var(--radius-card)] border p-4"
          >
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <h4 className="font-display min-w-0 flex-1 text-sm font-bold">{trail.question}</h4>
              <Badge size="xs" tone={trail.self_corrected ? 'success' : 'warning'}>
                {trail.self_corrected ? 'corrected' : 'not corrected'}
              </Badge>
              <Badge size="xs">{trail.attempts} attempts</Badge>
              <span className="text-ink-muted text-[11px]">{formatDateTime(trail.created_at)}</span>
              <Button variant="ghost" size="xs" onClick={() => openTrace(trail.request_id)}>
                <Waypoints className="size-3" />
                Trace
              </Button>
            </header>
            <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
              <AttemptCard evaluation={before} label="Before" tone="before" />
              <div className="hidden items-center justify-center lg:flex">
                <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-9 place-items-center rounded-full">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
              <AttemptCard evaluation={after !== before ? after : undefined} label="After" tone="after" />
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
