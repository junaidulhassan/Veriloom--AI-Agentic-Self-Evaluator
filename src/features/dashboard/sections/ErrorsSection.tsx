import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import {
  axisProps,
  cursorStyle,
  gridProps,
  legendProps,
  lineCursor,
  seriesColor,
} from '@/components/charts/theme'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { DataTable } from '@/components/ui/DataTable'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { getToolConfig } from '@/features/tools/registry'
import {
  formatDateTime,
  formatDuration,
  shortId,
  titleCase,
  truncate,
  sanitizeDisplayText,
} from '@/lib/format'
import { asString } from '@/lib/utils'
import type { ErrorLogOut, HallucinationItem, ToolExecutionOut } from '@/types/api'
import { useErrors, useHallucinations, useRecentErrors, useToolExecutions } from '../hooks'
import { Section } from '../components/Section'
import { dayTick, useChartAnimation } from '../components/chartHelpers'
import { useTraceViewer } from '../history/TraceViewerContext'
import { useDashboardFilters } from '../useDashboardFilters'

const categoryLabel: Record<string, string> = {
  llm: 'Language model',
  external: 'Web search / external',
  document: 'PDF',
  vector_store: 'Vector database',
  embedding: 'Embedding',
  sandbox: 'Python execution',
  timeout: 'Timeout',
  database: 'Database',
  tool: 'Tool',
  invalid_tool_call: 'Invalid tool call',
  evaluation: 'Evaluation',
  validation: 'Validation',
  agent: 'Agent',
}
const catName = (key: string | null) => categoryLabel[key ?? ''] ?? titleCase(key ?? 'unknown')

export default function ErrorsSection() {
  const errors = useErrors()
  const halluc = useHallucinations()
  const [page, setPage] = useState(1)
  const [failedPage, setFailedPage] = useState(1)
  const { filters } = useDashboardFilters()
  const recent = useRecentErrors(page)
  const failed = useToolExecutions(
    { status: 'error', page: failedPage, page_size: 10, tool_name: filters.tool },
    'failed-tools',
  )
  const openTrace = useTraceViewer()
  const anim = useChartAnimation()
  const [tab, setTab] = useState('errors')
  const e = errors.data

  const byCategory = useMemo(
    () => (e?.by_category ?? []).map((d) => ({ name: catName(d.key), key: d.key, count: d.count })),
    [e],
  )
  const topCats = byCategory.slice(0, 4).map((d) => d.key ?? 'unknown')
  const trend = useMemo(
    () =>
      (e?.daily ?? []).map((d) => ({
        date: d.date,
        Total: d.total,
        ...Object.fromEntries(topCats.map((c) => [catName(c), Number(d[c] ?? 0)])),
      })),
    [e, topCats],
  )
  const hallucTrend = useMemo(
    () =>
      (halluc.data?.daily ?? []).map((d) => ({
        date: d.date,
        rate: d.rate,
        hallucinated: d.hallucinated,
        evaluated: d.evaluated,
      })),
    [halluc.data],
  )

  const errorColumns = useMemo<ColumnDef<ErrorLogOut, unknown>[]>(
    () => [
      {
        accessorKey: 'category',
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge size="xs" tone="error">
            {catName(String(getValue()))}
          </Badge>
        ),
      },
      {
        accessorKey: 'error_type',
        header: 'Error',
        cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span>,
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-md">
            {truncate(sanitizeDisplayText(String(getValue())), 100)}
          </span>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ getValue }) => (
          <span className="text-ink-muted font-mono text-[11px]">{String(getValue())}</span>
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
  const toolColumns = useMemo<ColumnDef<ToolExecutionOut, unknown>[]>(
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
        accessorKey: 'error_type',
        header: 'Error type',
        cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? '-')}</span>,
      },
      {
        accessorKey: 'error_message',
        header: 'Message',
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-md">
            {truncate(sanitizeDisplayText(String(getValue() ?? '')), 90)}
          </span>
        ),
      },
      {
        accessorKey: 'duration_ms',
        header: 'Time',
        cell: ({ getValue }) => formatDuration(getValue() as number),
      },
      {
        accessorKey: 'created_at',
        header: 'When',
        cell: ({ getValue }) => <span className="text-ink-muted">{formatDateTime(String(getValue()))}</span>,
      },
    ],
    [],
  )
  const hallucColumns = useMemo<ColumnDef<HallucinationItem, unknown>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Question',
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-xs">{truncate(String(getValue() ?? ''), 70)}</span>
        ),
      },
      {
        accessorKey: 'answer_preview',
        header: 'Answer',
        cell: ({ getValue }) => (
          <span className="text-ink-muted line-clamp-1 max-w-xs">{truncate(String(getValue()), 70)}</span>
        ),
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ getValue }) => `${Math.round((getValue() as number) * 100)}%`,
      },
      { accessorKey: 'attempt', header: 'Attempt' },
      {
        accessorKey: 'corrected',
        header: 'Outcome',
        cell: ({ getValue, row }) =>
          getValue() ? (
            <Badge size="xs" tone="success">
              corrected
            </Badge>
          ) : row.original.is_final ? (
            <Badge size="xs" tone="error">
              final answer
            </Badge>
          ) : (
            <Badge size="xs">intermediate</Badge>
          ),
      },
      {
        id: 'trace',
        header: 'Trace',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(ev) => {
              ev.stopPropagation()
              openTrace(row.original.request_id)
            }}
          >
            <ExternalLink className="size-3" />
            Trace
          </Button>
        ),
      },
    ],
    [openTrace],
  )

  return (
    <Section
      id="errors"
      description="Failures across the language model, web search, PDF processing, the vector database, the sandbox and the agent, plus evaluator-detected hallucinations."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Errors by type"
          subtitle={
            e
              ? `${e.total_errors} errors · ${e.failed_requests} failed requests · ${e.failed_tool_calls} failed tool calls`
              : undefined
          }
          info="Logged errors grouped by subsystem category."
          loading={errors.isPending}
          error={errors.error}
          onRetry={() => errors.refetch()}
          empty={!byCategory.length}
          emptyTitle="No errors logged"
          emptyDescription="Nothing has failed in this period."
          csv={() => byCategory}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={byCategory}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="name"
                {...axisProps}
                interval={0}
                angle={byCategory.length > 5 ? -20 : 0}
                textAnchor={byCategory.length > 5 ? 'end' : 'middle'}
                height={byCategory.length > 5 ? 48 : 30}
              />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Errors"
                maxBarSize={72}
                radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: 'var(--chart-ink)', fontSize: 11 }}
                {...anim}
              >
                {byCategory.map((d, i) => (
                  <Cell key={d.name} fill={i < 6 ? seriesColor(i) : 'var(--series-neutral)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Error trend"
          info="Daily error totals with the four most frequent categories."
          loading={errors.isPending}
          error={errors.error}
          onRetry={() => errors.refetch()}
          empty={!trend.length}
          emptyTitle="No errors logged"
          csv={() => trend}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={dayTick} minTickGap={24} />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip
                cursor={lineCursor}
                content={<ChartTooltip labelFormatter={(x) => dayTick(String(x))} />}
              />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="Total"
                stroke="var(--series-neutral)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={trend.length < 3 ? { r: 3, strokeDasharray: '0' } : false}
                {...anim}
              />
              {topCats.map((c, i) => (
                <Line
                  key={c}
                  type="monotone"
                  dataKey={catName(c)}
                  stroke={seriesColor(i)}
                  strokeWidth={2}
                  dot={false}
                  {...anim}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard
        title="Hallucination rate over time"
        subtitle={
          halluc.data
            ? `${halluc.data.hallucinated_final} final hallucinations · ${halluc.data.corrected_hallucinations} caught and corrected (${halluc.data.correction_rate}%)`
            : undefined
        }
        info="Daily share of evaluated final answers flagged as hallucinations."
        loading={halluc.isPending}
        error={halluc.error}
        onRetry={() => halluc.refetch()}
        empty={!hallucTrend.length}
        csv={() => hallucTrend}
        height={240}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={hallucTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="date" {...axisProps} tickFormatter={dayTick} minTickGap={24} />
            <YAxis {...axisProps} width={44} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
            <Tooltip
              cursor={lineCursor}
              content={
                <ChartTooltip
                  labelFormatter={(x) => dayTick(String(x))}
                  formatter={(v, name) => (name === 'Hallucination rate' ? `${v}%` : String(v))}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Hallucination rate"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              {...anim}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card className="p-4 sm:p-5">
        <CardHeader
          title="Failure logs"
          icon={<AlertTriangle className="size-4" />}
          description="Recent errors, failed tool calls and hallucinated responses with links to their traces."
          className="mb-2"
        />
        <Tabs
          label="Failure logs"
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: 'errors', label: 'Recent errors', count: recent.data?.total },
            { value: 'tools', label: 'Failed tool calls', count: failed.data?.total },
            { value: 'halluc', label: 'Hallucinated responses', count: halluc.data?.recent.length },
          ]}
        >
          <TabPanel value="errors">
            <DataTable
              data={recent.data?.items}
              columns={errorColumns}
              loading={recent.isPending}
              error={recent.error}
              onRetry={() => recent.refetch()}
              server={{ page, pageSize: 10, total: recent.data?.total ?? 0, onPageChange: setPage }}
              exportName="recent-errors"
              emptyTitle="No errors"
              renderExpanded={(row) => (
                <div className="space-y-2 text-xs">
                  <p className="text-ink-soft">{sanitizeDisplayText(row.message)}</p>
                  {row.request_id ? (
                    <Button size="xs" variant="secondary" onClick={() => openTrace(row.request_id as string)}>
                      Open trace {shortId(row.request_id)}
                    </Button>
                  ) : null}
                  {Object.keys(row.details).length ? (
                    <CodeBlock
                      code={sanitizeDisplayText(asString(row.details))}
                      language="json"
                      maxHeight={220}
                    />
                  ) : null}
                </div>
              )}
            />
          </TabPanel>
          <TabPanel value="tools">
            <DataTable
              data={failed.data?.items}
              columns={toolColumns}
              loading={failed.isPending}
              error={failed.error}
              onRetry={() => failed.refetch()}
              server={{
                page: failedPage,
                pageSize: 10,
                total: failed.data?.total ?? 0,
                onPageChange: setFailedPage,
              }}
              exportName="failed-tool-calls"
              emptyTitle="No failed tool calls"
              renderExpanded={(row) => (
                <div className="grid gap-3 lg:grid-cols-2">
                  <CodeBlock code={asString(row.arguments)} language="json" title="input" maxHeight={220} />
                  <CodeBlock
                    code={sanitizeDisplayText(row.error_message ?? row.output ?? '')}
                    title="error"
                    maxHeight={220}
                  />
                  {row.request_id ? (
                    <div>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => openTrace(row.request_id as string)}
                      >
                        Open trace
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            />
          </TabPanel>
          <TabPanel value="halluc">
            <DataTable
              data={halluc.data?.recent}
              columns={hallucColumns}
              loading={halluc.isPending}
              error={halluc.error}
              onRetry={() => halluc.refetch()}
              exportName="hallucinations"
              emptyTitle="No hallucinations detected"
              renderExpanded={(row) => (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold">Question: </span>
                    {row.question}
                  </div>
                  <div className="bg-surface-strong text-ink-soft rounded-xl p-3">{row.answer_preview}</div>
                  <div>
                    <span className="font-bold">Evaluator reason: </span>
                    {row.reason}
                  </div>
                  <StatusBadge status={row.corrected ? 'success' : 'failed'} />
                </div>
              )}
            />
          </TabPanel>
        </Tabs>
      </Card>
    </Section>
  )
}
