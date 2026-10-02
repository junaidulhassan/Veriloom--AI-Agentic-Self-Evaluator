import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, SquareTerminal, Waypoints } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { TerminalPanel, codeExecutionProps } from '@/features/trace/renderers/PythonRenderer'
import { formatDateTime, shortId } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { useCodeExecutions } from '../hooks'
import { useTraceViewer } from './TraceViewerContext'

export function PythonLogsPanel() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const query = useCodeExecutions(page, status === 'all' ? undefined : status)
  const openTrace = useTraceViewer()
  const pages = query.data?.pages ?? 1
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Execution status"
          size="sm"
          className="w-40"
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'success', label: 'Success' },
            { value: 'error', label: 'Error' },
            { value: 'timeout', label: 'Timeout' },
            { value: 'sandbox_error', label: 'Sandbox error' },
          ]}
        />
        <span className="text-ink-muted ml-auto text-xs">
          {query.data?.total ?? 0} executions · page {page} of {Math.max(1, pages)}
        </span>
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
      {query.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState
          icon={<SquareTerminal className="size-6" aria-hidden />}
          title="No Python executions"
          description="Ask the assistant to run code and the sandbox runs will appear here."
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {query.data.items.map((item) => (
            <motion.article
              key={item.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit="exit"
              className="border-line bg-surface-strong/60 rounded-2xl border p-3"
            >
              <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={item.status} />
                <span className="text-ink-muted font-mono">{shortId(item.id, 10)}</span>
                <span className="text-ink-muted">
                  {item.backend} sandbox · {formatDateTime(item.created_at, 'MMM d, HH:mm:ss')}
                </span>
                {item.request_id ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-auto"
                    onClick={() => openTrace(item.request_id as string)}
                  >
                    <Waypoints className="size-3" />
                    Trace
                  </Button>
                ) : null}
              </header>
              <TerminalPanel {...codeExecutionProps(item)} />
            </motion.article>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
