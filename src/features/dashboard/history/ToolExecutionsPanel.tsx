import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Waypoints } from 'lucide-react'
import { BoolBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { DataTable } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getToolConfig } from '@/features/tools/registry'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatDateTime, formatDuration, shortId, truncate, sanitizeDisplayText } from '@/lib/format'
import { asString } from '@/lib/utils'
import type { ToolExecutionOut } from '@/types/api'
import { useToolExecutions } from '../hooks'
import { useDashboardFilters } from '../useDashboardFilters'
import { useTraceViewer } from './TraceViewerContext'

function stepFromExecution(row: ToolExecutionOut) {
  return {
    id: row.id,
    kind: 'tool' as const,
    status: row.status === 'success' ? ('success' as const) : ('failed' as const),
    attempt: row.attempt,
    startedAt: 0,
    title: row.tool_name,
    toolName: row.tool_name,
    args: row.arguments,
    output: row.output ?? '',
    metadata: row.output_metadata,
    error: row.error_message,
    durationMs: row.duration_ms,
  }
}

export function ToolExecutionsPanel() {
  const { filters } = useDashboardFilters()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [requestId, setRequestId] = useState('')
  const debounced = useDebouncedValue(requestId, 400)
  const query = useToolExecutions({
    page,
    page_size: 15,
    tool_name: filters.tool,
    status: status === 'all' ? undefined : (status as 'success' | 'error'),
    request_id: debounced || undefined,
  })
  const [selected, setSelected] = useState<ToolExecutionOut | null>(null)
  const openTrace = useTraceViewer()
  const columns = useMemo<ColumnDef<ToolExecutionOut, unknown>[]>(
    () => [
      {
        accessorKey: 'tool_name',
        header: 'Tool',
        cell: ({ getValue }) => {
          const c = getToolConfig(String(getValue()))
          const Icon = c.icon
          return (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Icon className="size-3.5" style={{ color: c.color }} aria-hidden />
              {c.shortLabel}
            </span>
          )
        },
      },
      {
        id: 'input',
        header: 'Input',
        accessorFn: (row) => getToolConfig(row.tool_name).summarize(row.arguments),
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-xs font-mono text-[11.5px]">
            {truncate(String(getValue()), 60)}
          </span>
        ),
      },
      {
        accessorKey: 'output',
        header: 'Output',
        cell: ({ getValue }) => (
          <span className="text-ink-muted line-clamp-1 max-w-xs">
            {truncate(String(getValue() ?? ''), 60)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        accessorKey: 'duration_ms',
        header: 'Time',
        cell: ({ getValue }) => <span className="font-mono">{formatDuration(getValue() as number)}</span>,
      },
      {
        accessorKey: 'request_id',
        header: 'Request',
        cell: ({ getValue }) => (
          <span className="text-ink-muted font-mono text-[11px]">{shortId(getValue() as string)}</span>
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
  const Renderer = selected ? getToolConfig(selected.tool_name).renderer : null
  return (
    <>
      <DataTable
        data={query.data?.items}
        columns={columns}
        loading={query.isPending}
        error={query.error}
        onRetry={() => query.refetch()}
        server={{ page, pageSize: 15, total: query.data?.total ?? 0, onPageChange: setPage }}
        onRowClick={setSelected}
        exportName="tool-executions"
        emptyTitle="No tool executions"
        toolbar={
          <>
            <Select
              label="Status filter"
              size="sm"
              className="w-32"
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'Any status' },
                { value: 'success', label: 'Success' },
                { value: 'error', label: 'Error' },
              ]}
            />
            <SearchInput
              value={requestId}
              onChange={(v) => {
                setRequestId(v)
                setPage(1)
              }}
              placeholder="Request ID"
              className="w-48"
            />
          </>
        }
      />
      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? getToolConfig(selected.tool_name).label : 'Tool execution'}
        description={
          selected
            ? `Execution ${shortId(selected.id, 12)} · ${formatDateTime(selected.created_at, 'MMM d, HH:mm:ss')}`
            : undefined
        }
        actions={
          selected?.request_id ? (
            <Button variant="secondary" size="sm" onClick={() => openTrace(selected.request_id as string)}>
              <Waypoints className="size-3.5" />
              Trace
            </Button>
          ) : null
        }
      >
        {selected && Renderer ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge status={selected.status} />
              <span className="font-mono">{formatDuration(selected.duration_ms)}</span>
              <span>attempt {selected.attempt}</span>
              <span className="inline-flex items-center gap-1">
                Right tool <BoolBadge value={selected.selection_correct} />
              </span>
              <span className="inline-flex items-center gap-1">
                Reliable <BoolBadge value={selected.output_reliable} />
              </span>
              <span className="inline-flex items-center gap-1">
                False info <BoolBadge value={selected.caused_false_information} invert />
              </span>
            </div>
            {selected.assessment_note ? (
              <p className="bg-surface-strong text-ink-soft rounded-xl p-3 text-xs">
                {selected.assessment_note}
              </p>
            ) : null}
            {selected.error_message ? (
              <div className="bg-error/10 text-error rounded-xl p-3 text-xs dark:text-[#ffb3ad]">
                <span className="font-mono font-bold">{selected.error_type}: </span>
                {sanitizeDisplayText(selected.error_message)}
              </div>
            ) : null}
            <div>
              <h3 className="text-ink-muted mb-2 text-sm font-bold">Input</h3>
              <CodeBlock code={asString(selected.arguments)} language="json" />
            </div>
            <div>
              <h3 className="text-ink-muted mb-2 text-sm font-bold">Output</h3>
              <Renderer step={stepFromExecution(selected)} />
            </div>
            {Object.keys(selected.output_metadata).length ? (
              <div>
                <h3 className="text-ink-muted mb-2 text-sm font-bold">Metadata</h3>
                <CodeBlock code={asString(selected.output_metadata)} language="json" maxHeight={260} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  )
}
