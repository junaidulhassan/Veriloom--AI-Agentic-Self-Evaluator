import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lightbulb, XCircle } from 'lucide-react'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { cn } from '@/lib/utils'
import { formatDuration, sanitizeDisplayText, isRateLimitError, FRIENDLY_ERROR } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import type { EvaluationSummary } from '@/types/api'

const checks: { key: keyof EvaluationSummary; label: string; invert?: boolean }[] = [
  { key: 'is_correct', label: 'Correctness' },
  { key: 'is_relevant', label: 'Relevance' },
  { key: 'is_hallucination', label: 'No hallucination', invert: true },
  { key: 'is_supported', label: 'Evidence support' },
  { key: 'tool_results_interpreted_correctly', label: 'Tool interpretation' },
  { key: 'is_logically_consistent', label: 'Logical consistency' },
  { key: 'is_well_written', label: 'Writing quality' },
]

export function confidenceColor(confidence: number | null | undefined) {
  if (confidence == null) return 'var(--series-neutral)'
  if (confidence >= 0.75) return 'var(--success)'
  if (confidence >= 0.5) return 'var(--warning)'
  return 'var(--error)'
}

export const EvaluationDetail = memo(function EvaluationDetail({
  evaluation,
}: {
  evaluation: EvaluationSummary
}) {
  if (evaluation.error) {
    return (
      <div className="bg-warning/15 text-ink-soft flex gap-2 rounded-xl px-3 py-2 text-xs">
        <AlertCircle className="dark:text-warning mt-0.5 size-3.5 shrink-0 text-[#8a5a0c]" aria-hidden />
        {isRateLimitError(evaluation.error) || evaluation.error === FRIENDLY_ERROR
          ? 'The evaluator could not score this attempt. Please try again later.'
          : `The evaluator could not score this attempt: ${sanitizeDisplayText(evaluation.error)}`}
      </div>
    )
  }
  const confidence = evaluation.confidence ?? 0
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <ProgressRing
          value={confidence * 100}
          size={58}
          stroke={6}
          color={confidenceColor(evaluation.confidence)}
          track="var(--chart-grid)"
          label={`Confidence ${Math.round(confidence * 100)} percent`}
        >
          <span className="font-sans text-[13px] font-extrabold tabular-nums">
            {Math.round(confidence * 100)}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="text-ink-muted text-[11px] font-bold tracking-wider uppercase">
            Evaluator confidence
          </div>
          <div className="text-ink-soft mt-0.5 flex flex-wrap gap-x-3 text-xs">
            <span>
              Quality{' '}
              {evaluation.quality_score != null ? `${Math.round(evaluation.quality_score * 100)}%` : '-'}
            </span>
            <span>Attempt {evaluation.attempt}</span>
            {evaluation.duration_ms ? <span>{formatDuration(evaluation.duration_ms)}</span> : null}
          </div>
        </div>
      </div>
      <motion.ul
        variants={stagger(0.04)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
      >
        {checks.map((check) => {
          const raw = evaluation[check.key] as boolean | null | undefined
          if (raw == null) return null
          const ok = check.invert ? !raw : raw
          return (
            <motion.li
              key={check.key}
              variants={fadeUp}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                ok
                  ? 'bg-success/10 text-[#1f7a51] dark:text-[#5fd3a0]'
                  : 'bg-error/10 text-error dark:text-[#ffb3ad]',
              )}
            >
              {ok ? (
                <CheckCircle2 className="size-3.5" aria-hidden />
              ) : (
                <XCircle className="size-3.5" aria-hidden />
              )}
              {check.label}
            </motion.li>
          )
        })}
      </motion.ul>
      {evaluation.reason ? (
        <p className="text-ink-soft text-xs leading-relaxed">{evaluation.reason}</p>
      ) : null}
      {evaluation.issues?.length ? (
        <ul className="text-ink-muted list-disc space-y-0.5 pl-4 text-xs">
          {evaluation.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      {evaluation.suggested_fix ? (
        <div className="bg-charcoal-900/[0.05] text-ink-soft dark:bg-cream/5 flex gap-2 rounded-xl px-3 py-2 text-xs">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {evaluation.suggested_fix}
        </div>
      ) : null}
    </div>
  )
})
