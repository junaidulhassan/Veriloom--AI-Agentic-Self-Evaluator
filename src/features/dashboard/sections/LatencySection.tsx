import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, cursorStyle, gridProps, legendProps, lineCursor } from '@/components/charts/theme'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { getToolConfig } from '@/features/tools/registry'
import { formatDateTime, formatDuration, formatNumber, truncate } from '@/lib/format'
import type { AgentRequestOut } from '@/types/api'
import { useActivity, useLatency, useRequests } from '../hooks'
import { Section } from '../components/Section'
import { dayTick, useChartAnimation } from '../components/chartHelpers'
import { useTraceViewer } from '../history/TraceViewerContext'

export default function LatencySection() {
  const latency = useLatency()
  const activity = useActivity()
  const requests = useRequests({ status: 'completed', page_size: 200 }, 'slowest-requests')
  const openTrace = useTraceViewer()
  const anim = useChartAnimation()
  const l = latency.data

  const trend = useMemo(
    () =>
      (l?.daily ?? []).map((d) => ({
        date: d.date,
        Average: Math.round(d.avg_latency_ms),
        p95: Math.round(d.p95_latency_ms),
      })),
    [l],
  )
  const histogram = useMemo(
    () => (activity.data?.latency_histogram ?? []).map((d) => ({ bucket: d.key ?? '', count: d.count })),
    [activity.data],
  )
  const byComponent = useMemo(() => {
    if (!l) return []
    const rows = Object.entries(l.tools).map(([name, p]) => ({
      name: getToolConfig(name).shortLabel,
      p50: Math.round(p.p50),
      p95: Math.round(p.p95),
    }))
    Object.entries(l.llm_calls).forEach(([name, p]) =>
      rows.push({ name: `LLM ${name}`, p50: Math.round(p.p50), p95: Math.round(p.p95) }),
    )
    if (l.retrieval.count)
      rows.push({ name: 'Retrieval', p50: Math.round(l.retrieval.p50), p95: Math.round(l.retrieval.p95) })
    return rows.sort((a, b) => b.p95 - a.p95)
  }, [l])
  const slowest = useMemo(
    () =>
      [...(requests.data?.items ?? [])]
        .filter((r) => r.latency_ms != null)
        .sort((a, b) => (b.latency_ms ?? 0) - (a.latency_ms ?? 0))
        .slice(0, 25),
    [requests.data],
  )

  const columns = useMemo<ColumnDef<AgentRequestOut, unknown>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Question',
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-md">{truncate(String(getValue()), 90)}</span>
        ),
      },
      {
        accessorKey: 'latency_ms',
        header: 'Latency',
        cell: ({ getValue }) => (
          <span className="font-mono font-bold">{formatDuration(getValue() as number)}</span>
        ),
      },
      { accessorKey: 'tool_call_count', header: 'Tools' },
      { accessorKey: 'attempts', header: 'Attempts' },
      {
        accessorKey: 'total_tokens',
        header: 'Tokens',
        cell: ({ getValue }) => formatNumber(getValue() as number),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        accessorKey: 'created_at',
        header: 'When',
        cell: ({ getValue }) => <span className="text-ink-muted">{formatDateTime(String(getValue()))}</span>,
      },
    ],
    [],
  )

  return (
    <Section id="latency" description="End-to-end request time, its distribution, and where the time goes.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Latency trend"
          subtitle={
            l
              ? `Overall p50 ${formatDuration(l.requests.p50)} · p95 ${formatDuration(l.requests.p95)}`
              : undefined
          }
          info="Daily mean and 95th percentile latency of completed requests. The backend provides daily mean and p95; the overall p50 is shown above."
          loading={latency.isPending}
          error={latency.error}
          onRetry={() => latency.refetch()}
          empty={!trend.length}
          csv={() => trend}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={dayTick} minTickGap={24} />
              <YAxis {...axisProps} width={56} tickFormatter={(v) => formatDuration(v)} />
              <Tooltip
                cursor={lineCursor}
                content={
                  <ChartTooltip
                    labelFormatter={(x) => dayTick(String(x))}
                    formatter={(v) => formatDuration(v)}
                  />
                }
              />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="Average"
                stroke="var(--series-2)"
                strokeWidth={2}
                dot={trend.length < 20 ? { r: 3 } : false}
                {...anim}
              />
              <Line
                type="monotone"
                dataKey="p95"
                stroke="var(--series-1)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={trend.length < 20 ? { r: 3, strokeDasharray: '0' } : false}
                {...anim}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Latency distribution"
          info="Completed requests grouped by end-to-end latency."
          loading={activity.isPending}
          error={activity.error}
          onRetry={() => activity.refetch()}
          empty={!histogram.some((d) => d.count)}
          csv={() => histogram}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={histogram}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="12%"
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Requests"
                fill="var(--series-5)"
                maxBarSize={72}
                radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: 'var(--chart-ink)', fontSize: 11 }}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard
        title="Latency by tool and LLM step"
        info="Median and p95 duration of each tool and LLM component, slowest first."
        loading={latency.isPending}
        error={latency.error}
        onRetry={() => latency.refetch()}
        empty={!byComponent.length}
        csv={() => byComponent}
        height={Math.max(220, byComponent.length * 38)}
      >
        <ResponsiveContainer width="100%" height={Math.max(220, byComponent.length * 38)}>
          <BarChart
            data={byComponent}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            barGap={2}
            barCategoryGap="22%"
          >
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={(v) => formatDuration(v)} />
            <YAxis type="category" dataKey="name" {...axisProps} width={120} interval={0} />
            <Tooltip cursor={cursorStyle} content={<ChartTooltip formatter={(v) => formatDuration(v)} />} />
            <Legend {...legendProps} />
            <Bar dataKey="p50" fill="var(--series-2)" radius={[0, 4, 4, 0]} {...anim} />
            <Bar dataKey="p95" fill="var(--series-4)" radius={[0, 4, 4, 0]} {...anim} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card className="p-4 sm:p-5">
        <CardHeader
          title="Slowest requests"
          description="Top 25 completed requests by latency. Click a row to open its full execution trace."
          className="mb-3"
        />
        <DataTable
          data={slowest}
          columns={columns}
          loading={requests.isPending}
          error={requests.error}
          onRetry={() => requests.refetch()}
          onRowClick={(row) => openTrace(row.id)}
          exportName="slowest-requests"
          initialSorting={[{ id: 'latency_ms', desc: true }]}
          emptyTitle="No completed requests"
        />
      </Card>
    </Section>
  )
}
