import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Waypoints } from 'lucide-react'
import { BoolBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Select } from '@/components/ui/Select'
import { EvaluationDetail } from '@/features/trace/components/EvaluationDetail'
import { formatDateTime, truncate } from '@/lib/format'
import type { EvaluationHistoryItem } from '@/types/api'
import { useEvaluations } from '../hooks'
import { useTraceViewer } from './TraceViewerContext'

const tri = (v: string) => (v === 'any' ? undefined : v === 'true')
const triOptions = (label: string) => [
  { value: 'any', label: `${label}: any` },
  { value: 'true', label: `${label}: yes` },
  { value: 'false', label: `${label}: no` },
]

export function EvaluationsPanel() {
  const [page, setPage] = useState(1)
  const [correct, setCorrect] = useState('any')
  const [halluc, setHalluc] = useState('any')
  const [retry, setRetry] = useState('any')
  const [final, setFinal] = useState('any')
  const query = useEvaluations({
    page,
    page_size: 15,
    is_correct: tri(correct),
    is_hallucination: tri(halluc),
    needs_retry: tri(retry),
    is_final: tri(final),
  })
  const openTrace = useTraceViewer()
  const columns = useMemo<ColumnDef<EvaluationHistoryItem, unknown>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Question',
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-xs font-semibold">
            {truncate(String(getValue() ?? ''), 60)}
          </span>
        ),
      },
      {
        accessorKey: 'is_correct',
        header: 'Correct',
        cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} />,
      },
      {
        accessorKey: 'is_hallucination',
        header: 'Hallucination',
        cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} invert />,
      },
      {
        accessorKey: 'is_relevant',
        header: 'Relevant',
        cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} />,
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ getValue }) => (
          <span className="font-mono">{Math.round((getValue() as number) * 100)}%</span>
        ),
      },
      {
        accessorKey: 'needs_retry',
        header: 'Retry',
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge size="xs" tone="warning">
              needs retry
            </Badge>
          ) : (
            <Badge size="xs">no</Badge>
          ),
      },
      {
        accessorKey: 'attempt',
        header: 'Attempt',
        cell: ({ row }) => (
          <span>
            {row.original.attempt}
            {row.original.is_final ? (
              <Badge size="xs" tone="dark" className="ml-1">
                final
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ getValue }) => (
          <span className="text-ink-muted line-clamp-1 max-w-sm">{truncate(String(getValue()), 80)}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'When',
        cell: ({ getValue }) => <span className="text-ink-muted">{formatDateTime(String(getValue()))}</span>,
      },
    ],
    [],
  )
  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(1)
  }
  return (
    <DataTable
      data={query.data?.items}
      columns={columns}
      loading={query.isPending}
      error={query.error}
      onRetry={() => query.refetch()}
      server={{ page, pageSize: 15, total: query.data?.total ?? 0, onPageChange: setPage }}
      exportName="evaluations"
      emptyTitle="No evaluations"
      initialHidden={{ is_relevant: false }}
      toolbar={
        <>
          <Select
            label="Correct filter"
            size="sm"
            className="w-36"
            value={correct}
            onValueChange={reset(setCorrect)}
            options={triOptions('Correct')}
          />
          <Select
            label="Hallucination filter"
            size="sm"
            className="w-44"
            value={halluc}
            onValueChange={reset(setHalluc)}
            options={triOptions('Hallucination')}
          />
          <Select
            label="Needs retry filter"
            size="sm"
            className="w-36"
            value={retry}
            onValueChange={reset(setRetry)}
            options={triOptions('Retry')}
          />
          <Select
            label="Final filter"
            size="sm"
            className="w-32"
            value={final}
            onValueChange={reset(setFinal)}
            options={triOptions('Final')}
          />
        </>
      }
      renderExpanded={(row) => (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-ink-muted text-[11px] font-bold tracking-wider uppercase">
              Answer evaluated
            </div>
            <p className="bg-surface-strong text-ink-soft max-h-60 overflow-y-auto rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap">
              {row.answer}
            </p>
            <Button size="xs" variant="secondary" onClick={() => openTrace(row.request_id)}>
              <Waypoints className="size-3" />
              Open trace
            </Button>
          </div>
          <EvaluationDetail
            evaluation={{ ...row, issues: [], missing_information: row.missing_information }}
          />
        </div>
      )}
    />
  )
}
