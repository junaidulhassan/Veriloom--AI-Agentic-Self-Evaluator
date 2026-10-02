import { memo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertOctagon,
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Flag,
  Loader2,
  Repeat2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Markdown } from '@/components/ui/Markdown'
import { evaluatorConfig, getToolConfig } from '@/features/tools/registry'
import { formatDuration, formatNumber, userFacingError, FRIENDLY_ERROR } from '@/lib/format'
import { cn, asString } from '@/lib/utils'
import { spring } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { TraceStep } from '../types'
import { ElapsedTimer } from './ElapsedTimer'
import { EvaluationDetail } from './EvaluationDetail'
import { Collapsible } from '../renderers/shared'

const statusRing: Record<TraceStep['status'], string> = {
  pending: 'bg-charcoal-900/10 text-ink-muted',
  running: 'bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900',
  success: 'bg-surface-strong text-ink ring-1 ring-line-strong',
  failed: 'bg-error text-cream',
  skipped: 'bg-charcoal-900/10 text-ink-muted',
}

function StepIcon({ step }: { step: TraceStep }) {
  if (step.kind === 'tool') {
    const Icon = getToolConfig(step.toolName).icon
    return <Icon className="size-4" aria-hidden />
  }
  if (step.kind === 'evaluation') {
    const Icon = evaluatorConfig.icon
    return <Icon className="size-4" aria-hidden />
  }
  if (step.kind === 'retry') return <Repeat2 className="animate-spin-slow size-4" aria-hidden />
  if (step.kind === 'final') return <Flag className="size-4" aria-hidden />
  if (step.kind === 'error') return <AlertOctagon className="size-4" aria-hidden />
  return <Brain className="size-4" aria-hidden />
}

function StatusGlyph({ status }: { status: TraceStep['status'] }) {
  if (status === 'running') return <Loader2 className="size-3.5 animate-spin" aria-label="Running" />
  if (status === 'success') return <CheckCircle2 className="text-success size-3.5" aria-label="Succeeded" />
  if (status === 'failed')
    return <XCircle className="text-error size-3.5 dark:text-[#ff8a80]" aria-label="Failed" />
  return <CircleDashed className="text-ink-muted size-3.5" aria-label={status} />
}

function Node({ step }: { step: TraceStep }) {
  const running = step.status === 'running'
  return (
    <div className="relative grid size-9 shrink-0 place-items-center">
      {running ? (
        <span
          className="animate-pulse-orb bg-coral-400/45 dark:bg-coral-500/40 absolute inset-0 rounded-full blur-[2px]"
          aria-hidden
        />
      ) : null}
      <motion.span
        layout
        className={cn(
          'relative grid size-8 place-items-center rounded-full shadow-sm transition-colors',
          statusRing[step.status],
        )}
        style={
          step.kind === 'tool' && step.status === 'success'
            ? { color: getToolConfig(step.toolName).color }
            : undefined
        }
      >
        <StepIcon step={step} />
      </motion.span>
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  const reduced = useReducedMotion()
  return (
    <svg
      className="absolute top-9 left-[17px] h-[calc(100%-36px)] w-[2px] overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 2 100"
      aria-hidden
    >
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="100"
        stroke="var(--line-strong)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <motion.line
        x1="1"
        y1="0"
        x2="1"
        y2="100"
        stroke={active ? 'var(--accent)' : 'var(--ink-muted)'}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
      />
    </svg>
  )
}

function ShimmerLine({ label }: { label: string }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="skeleton h-2 w-32 rounded-full" aria-hidden />
      <span className="text-ink-muted text-xs">{label}</span>
    </div>
  )
}

function IndeterminateBar() {
  return (
    <div
      className="bg-charcoal-900/10 dark:bg-cream/10 relative mt-2 h-1 w-full max-w-60 overflow-hidden rounded-full"
      aria-hidden
    >
      <motion.div
        className="bg-charcoal-900 dark:bg-coral-400 absolute inset-y-0 w-1/3 rounded-full"
        initial={{ x: '-100%' }}
        animate={{ x: '300%' }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function StepBody({
  step,
  expandOutputs,
  maxAttempts,
}: {
  step: TraceStep
  expandOutputs: boolean
  maxAttempts: number
}) {
  const running = step.status === 'running'
  if (step.kind === 'thinking') {
    if (running)
      return (
        <ShimmerLine label={step.title === 'Thinking' ? 'Selecting tool...' : 'Planning the next step...'} />
      )
    return step.content ? (
      <Collapsible label="Reasoning" defaultOpen={expandOutputs} className="mt-2">
        <Markdown content={step.content} className="text-[13px]" />
      </Collapsible>
    ) : null
  }
  if (step.kind === 'tool') {
    const config = getToolConfig(step.toolName)
    const Renderer = config.renderer
    const argsText = asString(step.args ?? {})
    return (
      <div className="mt-2 space-y-2">
        {running ? <IndeterminateBar /> : null}
        {step.args && Object.keys(step.args).length ? (
          <Collapsible
            label={
              <>
                Input{' '}
                <span className="text-ink-muted font-mono font-normal">
                  {config.summarize(step.args).slice(0, 80)}
                </span>
              </>
            }
          >
            {step.toolName === 'python_executor' && typeof step.args.code === 'string' ? (
              <CodeBlock code={step.args.code} language="python" maxHeight={240} />
            ) : (
              <CodeBlock code={argsText} language="json" maxHeight={220} />
            )}
          </Collapsible>
        ) : null}
        {!running && (step.output || step.error) ? (
          <Collapsible label="Output" defaultOpen={expandOutputs}>
            {step.status === 'failed' && step.error ? (
              <div className="bg-error/10 text-error mb-2 rounded-lg px-3 py-2 text-xs dark:text-[#ffb3ad]">
                {step.errorType &&
                userFacingError(step.error) !== FRIENDLY_ERROR &&
                step.error !== FRIENDLY_ERROR ? (
                  <span className="font-mono font-bold">{step.errorType}: </span>
                ) : null}
                {userFacingError(step.error)}
              </div>
            ) : null}
            <Renderer step={step} />
          </Collapsible>
        ) : null}
        {step.assessment &&
        (step.assessment.selectionCorrect != null || step.assessment.outputReliable != null) ? (
          <div className="flex flex-wrap gap-1.5">
            {step.assessment.selectionCorrect != null ? (
              <Badge size="xs" tone={step.assessment.selectionCorrect ? 'success' : 'error'}>
                {step.assessment.selectionCorrect ? 'Right tool' : 'Wrong tool choice'}
              </Badge>
            ) : null}
            {step.assessment.outputReliable != null ? (
              <Badge size="xs" tone={step.assessment.outputReliable ? 'success' : 'warning'}>
                {step.assessment.outputReliable ? 'Reliable output' : 'Unreliable output'}
              </Badge>
            ) : null}
            {step.assessment.causedFalseInformation ? (
              <Badge size="xs" tone="error">
                Introduced false info
              </Badge>
            ) : null}
            {step.assessment.note ? (
              <span className="text-ink-muted text-[11px]">{step.assessment.note}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }
  if (step.kind === 'evaluation') {
    if (running) return <ShimmerLine label="Checking correctness, relevance and hallucinations..." />
    if (step.status === 'skipped')
      return <p className="text-ink-muted mt-1 text-xs">Evaluation was skipped for this request.</p>
    return step.evaluation ? (
      <div className="mt-2">
        <EvaluationDetail evaluation={step.evaluation} />
      </div>
    ) : null
  }
  if (step.kind === 'retry') {
    return (
      <div className="border-coral-600/50 bg-coral-100/50 text-ink-soft dark:bg-coral-500/10 mt-2 rounded-xl border border-dashed px-3 py-2 text-xs leading-relaxed">
        <div className="text-ink font-semibold">
          Attempt {step.nextAttempt} of {maxAttempts}
        </div>
        {step.retryReason ? <p className="mt-1">{step.retryReason}</p> : null}
        {step.content ? <p className="text-ink-muted mt-1">Fix: {step.content}</p> : null}
      </div>
    )
  }
  if (step.kind === 'error') {
    return (
      <div className="bg-error/10 text-error mt-2 rounded-xl px-3 py-2 text-xs dark:text-[#ffb3ad]">
        {step.errorType && userFacingError(step.error) !== FRIENDLY_ERROR && step.error !== FRIENDLY_ERROR ? (
          <span className="font-mono font-bold">{step.errorType}: </span>
        ) : null}
        {userFacingError(step.error)}
      </div>
    )
  }
  return null
}

export const TraceStepItem = memo(function TraceStepItem({
  step,
  isLast,
  expandOutputs,
  maxAttempts,
}: {
  step: TraceStep
  isLast: boolean
  expandOutputs: boolean
  maxAttempts: number
}) {
  const [open, setOpen] = useState(true)
  const config = step.kind === 'tool' ? getToolConfig(step.toolName) : null
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="relative flex gap-3 pb-4 last:pb-0"
    >
      {!isLast ? <Connector active={step.status === 'success'} /> : null}
      <Node step={step} />
      <div className="min-w-0 flex-1 pt-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left"
        >
          <span className="text-ink text-[13.5px] font-bold">
            {step.kind === 'retry' ? 'Self-correcting' : step.title}
          </span>
          {config ? (
            <Badge size="xs" tone="neutral" className="font-mono" style={{ color: config.color }}>
              {step.toolName}
            </Badge>
          ) : null}
          {step.attempt > 1 || step.kind === 'retry' ? (
            <Badge size="xs" tone="coral">
              attempt {step.kind === 'retry' ? step.nextAttempt : step.attempt}
            </Badge>
          ) : null}
          <span className="text-ink-muted ml-auto flex items-center gap-1.5 text-[11.5px]">
            {step.tokens ? <span className="font-mono">{formatNumber(step.tokens)} tok</span> : null}
            {step.status === 'running' ? (
              <ElapsedTimer since={step.startedAt} className="font-mono tabular-nums" />
            ) : step.durationMs != null && step.kind !== 'retry' ? (
              <span className="font-mono tabular-nums">{formatDuration(step.durationMs)}</span>
            ) : null}
            <StatusGlyph status={step.status} />
            <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="overflow-hidden"
            >
              <StepBody step={step} expandOutputs={expandOutputs} maxAttempts={maxAttempts} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.li>
  )
})

export const TraceTimeline = memo(function TraceTimeline({
  steps,
  expandOutputs = false,
  maxAttempts = 3,
  hideFinal = false,
  header,
}: {
  steps: TraceStep[]
  expandOutputs?: boolean
  maxAttempts?: number
  hideFinal?: boolean
  header?: ReactNode
}) {
  const visible = hideFinal ? steps.filter((step) => step.kind !== 'final') : steps
  return (
    <div>
      {header}
      <motion.ol layout className="relative" aria-label="Agent execution steps">
        <AnimatePresence initial={false}>
          {visible.map((step, index) => (
            <TraceStepItem
              key={step.id}
              step={step}
              isLast={index === visible.length - 1}
              expandOutputs={expandOutputs}
              maxAttempts={maxAttempts}
            />
          ))}
        </AnimatePresence>
      </motion.ol>
    </div>
  )
})
