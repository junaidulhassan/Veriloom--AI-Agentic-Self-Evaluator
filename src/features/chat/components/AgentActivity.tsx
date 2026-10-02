import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TraceTimeline } from '@/features/trace/components/TraceTimeline'
import { TraceSummaryBar } from '@/features/trace/components/TraceSummaryBar'
import { ElapsedTimer } from '@/features/trace/components/ElapsedTimer'
import type { TraceState } from '@/features/trace/types'

export const AgentActivity = memo(function AgentActivity({
  trace,
  mode,
}: {
  trace: TraceState
  mode?: 'stream' | 'fallback'
}) {
  const running = trace.status === 'running' || trace.status === 'idle'
  const [open, setOpen] = useState(running)
  useEffect(() => {
    if (running) setOpen(true)
    else {
      const timer = setTimeout(() => setOpen(false), 700)
      return () => clearTimeout(timer)
    }
  }, [running])
  return (
    <motion.div layout className="w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {running ? (
          <motion.div
            key="live"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border-line bg-surface-strong/60 rounded-2xl border p-3.5"
            aria-live="polite"
          >
            <div className="text-ink mb-3 flex items-center gap-2 text-xs font-bold">
              <span className="relative grid size-5 place-items-center">
                <span className="animate-pulse-orb bg-coral-400/60 absolute inset-0 rounded-full" />
                <Sparkles className="relative size-3" aria-hidden />
              </span>
              Agent activity
              {trace.attempt > 1 ? (
                <span className="text-ink-muted font-semibold">
                  · attempt {trace.attempt} of {trace.maxAttempts}
                </span>
              ) : null}
              {mode === 'fallback' ? (
                <span className="text-ink-muted font-medium">· replaying execution</span>
              ) : null}
              <ElapsedTimer
                since={trace.startedAt}
                className="text-ink-muted ml-auto font-mono text-[11px] font-medium"
              />
            </div>
            <TraceTimeline steps={trace.steps} maxAttempts={trace.maxAttempts} hideFinal />
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <TraceSummaryBar state={trace} open={open} onToggle={() => setOpen((value) => !value)} />
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="border-line bg-surface-strong/60 rounded-2xl border p-3.5">
                    <TraceTimeline steps={trace.steps} maxAttempts={trace.maxAttempts} hideFinal />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
