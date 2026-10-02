import { memo } from 'react'
import { Waypoints, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { TraceOverview } from '@/features/trace/components/TraceOverview'
import { TraceTimeline } from '@/features/trace/components/TraceTimeline'
import { useAgentTrace } from '../hooks/useAgentTrace'
import { useChatStore } from '../store'

export const TraceInspector = memo(function TraceInspector({ onClose }: { onClose: () => void }) {
  const selected = useChatStore((s) => s.selectedRequestId)
  const turns = useChatStore((s) => s.turns)
  const fallbackTurn = [...turns].reverse().find((turn) => turn.requestId)
  const requestId = selected ?? fallbackTurn?.requestId ?? null
  const liveTurn = turns.find(
    (turn) => turn.requestId === requestId && (turn.status === 'sending' || turn.status === 'streaming'),
  )
  const trace = useAgentTrace(liveTurn ? null : requestId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-line flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-8 place-items-center rounded-xl">
          <Waypoints className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-bold">Agent Trace</h2>
          <p className="text-ink-muted truncate text-[11px]">
            {liveTurn ? 'Live execution' : requestId ? 'Full execution trace' : 'Select a message to inspect'}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close trace inspector">
          <X className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {liveTurn ? (
          <TraceTimeline
            steps={liveTurn.trace.steps}
            maxAttempts={liveTurn.trace.maxAttempts}
            expandOutputs
          />
        ) : !requestId ? (
          <EmptyState
            icon={<Waypoints className="size-6" aria-hidden />}
            title="No trace selected"
            description="Use the trace button under any assistant answer to inspect every reasoning step, tool call and evaluation."
          />
        ) : trace.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <SkeletonText lines={5} />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : trace.error ? (
          <ErrorState error={trace.error} onRetry={() => trace.refetch()} />
        ) : trace.data && trace.state ? (
          <div className="space-y-5">
            <TraceOverview trace={trace.data} />
            <TraceTimeline steps={trace.state.steps} maxAttempts={trace.state.maxAttempts} expandOutputs />
          </div>
        ) : null}
      </div>
    </div>
  )
})
