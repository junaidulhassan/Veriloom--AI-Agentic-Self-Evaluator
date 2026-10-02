import { memo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertOctagon, RotateCw, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { Markdown } from '@/components/ui/Markdown'
import { Skeleton } from '@/components/ui/Skeleton'
import { useInView } from '@/hooks/useInView'
import { formatDateTime, userFacingError } from '@/lib/format'
import { spring } from '@/lib/motion'
import { TraceSummaryBar } from '@/features/trace/components/TraceSummaryBar'
import { TraceTimeline } from '@/features/trace/components/TraceTimeline'
import { useAgentTrace } from '../hooks/useAgentTrace'
import { useTypewriter } from '../hooks/useTypewriter'
import { metaFromResponse, metaFromTrace } from '../meta'
import { useChatStore, type LiveTurn } from '../store'
import { AgentActivity } from './AgentActivity'
import { MessageActions } from './MessageActions'
import { MetadataRow } from './MetadataRow'
import { SourceChips } from './SourceChips'

export const UserMessage = memo(function UserMessage({
  content,
  createdAt,
}: {
  content: string
  createdAt?: string | number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="flex justify-end"
    >
      <div className="max-w-[min(680px,85%)]">
        <div className="bg-charcoal-900 text-cream dark:bg-charcoal-700 rounded-3xl rounded-br-lg px-4 py-3 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap shadow-[0_10px_30px_-14px_rgb(28_28_31/0.7)]">
          {content}
        </div>
        {createdAt ? (
          <div className="text-on-page/70 mt-1 text-right text-[10.5px]">
            {formatDateTime(typeof createdAt === 'number' ? new Date(createdAt) : createdAt, 'HH:mm')}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
})

function AssistantShell({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex gap-3"
    >
      <div className="hidden pt-1 sm:block">
        <div className={active ? 'animate-pulse-orb' : undefined}>
          <LogoMark size={32} animate={false} />
        </div>
      </div>
      <div className="glass min-w-0 flex-1 space-y-3 rounded-3xl rounded-tl-lg p-4 sm:p-5">{children}</div>
    </motion.div>
  )
}

export const LiveAssistantMessage = memo(function LiveAssistantMessage({
  turn,
  onRegenerate,
}: {
  turn: LiveTurn
  onRegenerate: (question: string) => void
}) {
  const updateTurn = useChatStore((s) => s.updateTurn)
  const selectRequest = useChatStore((s) => s.selectRequest)
  const answer = turn.response?.answer ?? ''
  const finished = turn.status === 'done' || turn.status === 'failed'
  const { visible, typing } = useTypewriter(answer, finished && !turn.revealed && Boolean(answer), () =>
    updateTurn(turn.key, (current) => ({ ...current, revealed: true })),
  )
  const meta = turn.response ? metaFromResponse(turn.response) : null
  const running = turn.status === 'sending' || turn.status === 'streaming'
  return (
    <AssistantShell active={running}>
      <AgentActivity trace={turn.trace} mode={turn.mode} />
      {running && !turn.trace.steps.length ? <Skeleton className="h-4 w-1/2" /> : null}
      {turn.status === 'cancelled' ? (
        <div className="text-ink-muted flex items-center gap-2 text-sm">
          <Square className="size-3.5" aria-hidden />
          Generation stopped.
          <Button variant="secondary" size="xs" onClick={() => onRegenerate(turn.question)}>
            <RotateCw className="size-3" />
            Retry
          </Button>
        </div>
      ) : null}
      {turn.status === 'failed' ? (
        <div
          role="alert"
          className="border-error/25 bg-error/[0.06] dark:bg-error/20 flex flex-wrap items-start gap-3 rounded-2xl border p-3 text-sm"
        >
          <AlertOctagon className="text-error mt-0.5 size-4 shrink-0 dark:text-[#ffb3ad]" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">The agent could not complete this request</div>
            <div className="text-ink-muted mt-0.5 text-xs">
              {userFacingError(turn.error ?? turn.response?.error?.message ?? 'Unknown error')}
            </div>
          </div>
          <Button size="xs" onClick={() => onRegenerate(turn.question)}>
            <RotateCw className="size-3" />
            Retry
          </Button>
        </div>
      ) : null}
      {answer && turn.status !== 'failed' ? (
        <div className="relative">
          <Markdown content={visible} />
          {typing ? (
            <span
              className="animate-caret bg-coral-600 ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 rounded-full"
              aria-hidden
            />
          ) : null}
        </div>
      ) : null}
      {finished && !typing && meta ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-line space-y-3 border-t pt-3"
        >
          <SourceChips sources={meta.sources} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MetadataRow meta={meta} />
            <MessageActions
              text={answer}
              onRegenerate={() => onRegenerate(turn.question)}
              onTrace={turn.requestId ? () => selectRequest(turn.requestId ?? null) : undefined}
            />
          </div>
        </motion.div>
      ) : null}
    </AssistantShell>
  )
})

export const StoredAssistantMessage = memo(function StoredAssistantMessage({
  content,
  requestId,
  question,
  busy,
  onRegenerate,
}: {
  content: string
  requestId: string | null
  question?: string
  busy: boolean
  onRegenerate: (question: string) => void
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '200px' })
  const trace = useAgentTrace(requestId, { enabled: inView })
  const selectRequest = useChatStore((s) => s.selectRequest)
  const [open, setOpen] = useState(false)
  const meta = trace.data ? metaFromTrace(trace.data) : null
  return (
    <div ref={ref}>
      <AssistantShell>
        {trace.state ? (
          <div className="space-y-2">
            <TraceSummaryBar state={trace.state} open={open} onToggle={() => setOpen((value) => !value)} />
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-line bg-surface-strong/60 rounded-2xl border p-3.5">
                    <TraceTimeline
                      steps={trace.state.steps}
                      maxAttempts={trace.state.maxAttempts}
                      hideFinal
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : requestId && trace.isPending && inView ? (
          <Skeleton className="h-9 rounded-2xl" />
        ) : null}
        <Markdown content={content} />
        {meta ? (
          <div className="border-line space-y-3 border-t pt-3">
            <SourceChips sources={meta.sources} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MetadataRow meta={meta} />
              <MessageActions
                text={content}
                disabled={busy}
                onRegenerate={question ? () => onRegenerate(question) : undefined}
                onTrace={requestId ? () => selectRequest(requestId) : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="border-line flex justify-end border-t pt-2">
            <MessageActions
              text={content}
              disabled={busy}
              onRegenerate={question ? () => onRegenerate(question) : undefined}
            />
          </div>
        )}
      </AssistantShell>
    </div>
  )
})
