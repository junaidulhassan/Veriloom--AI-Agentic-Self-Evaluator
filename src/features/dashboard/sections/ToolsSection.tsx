import { memo, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CheckCircle2, Clock, ShieldQuestion, XCircle } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { LazyEChart, type ThemedOption } from '@/components/charts/LazyEChart'
import { axisProps, cursorStyle, gridProps, legendProps } from '@/components/charts/theme'
import { Badge } from '@/components/ui/Badge'
import { CountUp } from '@/components/ui/CountUp'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sparkline } from '@/components/ui/Sparkline'
import { Tooltip as Tip } from '@/components/ui/Tooltip'
import { getToolConfig } from '@/features/tools/registry'
import { formatDuration, formatPercent, formatRelative } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ToolStats } from '@/types/api'
import { useActivity, useToolDetail, useToolStats } from '../hooks'
import { Section } from '../components/Section'
import { useChartAnimation } from '../components/chartHelpers'
import { useDashboardFilters } from '../useDashboardFilters'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ToolCard = memo(function ToolCard({ stats, dimmed }: { stats: ToolStats; dimmed: boolean }) {
  const config = getToolConfig(stats.tool_name)
  const detail = useToolDetail(stats.tool_name)
  const Icon = config.icon
  const spark = (detail.data?.daily ?? []).map((d) => d.calls)
  const reliability = stats.assessed_calls ? stats.reliability_rate : stats.success_rate
  return (
    <motion.article
      variants={fadeUp}
      className={cn(
        'glass flex flex-col gap-3 rounded-[var(--radius-card)] p-4 transition-[opacity,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]',
        dimmed && 'opacity-45',
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className="bg-charcoal-900 dark:bg-charcoal-700 grid size-10 shrink-0 place-items-center rounded-2xl"
          style={{ color: config.color }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-[15px] font-bold">{config.label}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <Badge size="xs" tone="outline" className="font-mono">
              {stats.tool_name}
            </Badge>
            {stats.available === false ? (
              <Badge size="xs" tone="warning">
                unavailable
              </Badge>
            ) : null}
            {!stats.registered ? (
              <Badge size="xs" tone="neutral">
                unregistered
              </Badge>
            ) : null}
          </div>
        </div>
        <Tip content={`Success rate ${formatPercent(stats.success_rate)}`}>
          <span tabIndex={0}>
            <ProgressRing
              value={stats.success_rate}
              size={48}
              stroke={5}
              color={config.color}
              track="var(--chart-grid)"
              label={`Success rate ${stats.success_rate}%`}
            >
              <span className="text-[11px] font-extrabold tabular-nums">
                {Math.round(stats.success_rate)}%
              </span>
            </ProgressRing>
          </span>
        </Tip>
      </header>
      <div className="flex items-end justify-between gap-2">
        <div>
          <CountUp value={stats.total_calls} className="font-sans text-3xl font-extrabold tabular-nums" />
          <div className="text-ink-muted text-[11px] font-semibold">total calls</div>
        </div>
        <div className="w-28">
          {spark.length > 1 ? (
            <Sparkline values={spark} color={config.color} label={`${config.label} daily calls`} />
          ) : detail.isPending ? (
            <Skeleton className="h-9" />
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="text-success size-3.5" aria-hidden />
          <dt className="text-ink-muted">Successful</dt>
          <dd className="ml-auto font-mono font-semibold">{stats.successful_calls}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="text-error size-3.5" aria-hidden />
          <dt className="text-ink-muted">Failed</dt>
          <dd className="ml-auto font-mono font-semibold">{stats.failed_calls}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="text-ink-muted size-3.5" aria-hidden />
          <dt className="text-ink-muted">Failure</dt>
          <dd className="ml-auto font-mono font-semibold">{formatPercent(stats.failure_rate)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="text-ink-muted size-3.5" aria-hidden />
          <dt className="text-ink-muted">Avg time</dt>
          <dd className="ml-auto font-mono font-semibold">{formatDuration(stats.duration.avg)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldQuestion className="text-ink-muted size-3.5" aria-hidden />
          <dt className="text-ink-muted">Wrong pick</dt>
          <dd className="ml-auto font-mono font-semibold">{stats.incorrect_selections}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="text-error size-3.5" aria-hidden />
          <dt className="text-ink-muted">False info</dt>
          <dd className="ml-auto font-mono font-semibold">{stats.false_information_count}</dd>
        </div>
      </dl>
      <div>
        <div className="text-ink-muted mb-1 flex justify-between text-[11px] font-semibold">
          <span>Reliability score</span>
          <span className="font-mono">{formatPercent(reliability)}</span>
        </div>
        <div className="bg-charcoal-900/10 dark:bg-cream/10 h-1.5 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{ background: config.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${reliability}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="text-ink-muted mt-1.5 text-[10.5px]">
          {stats.last_called_at
            ? `Last called ${formatRelative(stats.last_called_at)}`
            : 'Not called in this period'}
        </div>
      </div>
    </motion.article>
  )
})

export default function ToolsSection() {
  const tools = useToolStats()
  const activity = useActivity()
  const { filters } = useDashboardFilters()
  const anim = useChartAnimation()
  const list = useMemo(
    () => [...(tools.data ?? [])].sort((a, b) => b.total_calls - a.total_calls),
    [tools.data],
  )
  const used = list.filter((t) => t.total_calls > 0)
  const labels = useMemo(
    () => Object.fromEntries(list.map((t) => [t.tool_name, getToolConfig(t.tool_name).shortLabel])),
    [list],
  )

  const outcome = used.map((t) => ({
    tool: labels[t.tool_name],
    Successful: t.successful_calls,
    Failed: t.failed_calls,
  }))
  const timing = used.map((t) => ({
    tool: labels[t.tool_name],
    p50: Math.round(t.duration.p50),
    p95: Math.round(t.duration.p95),
    max: Math.round(t.duration.max),
  }))
  const quality = used.map((t) => ({
    tool: labels[t.tool_name],
    'Wrong selection': t.incorrect_selections,
    'Unreliable output': t.unreliable_outputs,
    'False information': t.false_information_count,
  }))

  const treemapOption = useCallback<ThemedOption>(
    (c) => ({
      tooltip: {
        formatter: (info: unknown) => {
          const i = info as { name: string; value: number }
          return `${i.name}: ${i.value} calls`
        },
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          label: {
            show: true,
            formatter: '{b}\n{c}',
            color: '#fff8f5',
            fontWeight: 700,
            fontSize: 12,
            lineHeight: 16,
          },
          itemStyle: { borderColor: c['chart-surface'], borderWidth: 3, gapWidth: 3, borderRadius: 10 },
          data: used.map((t) => {
            const color = getToolConfig(t.tool_name).color
            const resolved = color.startsWith('var(')
              ? ((c as unknown as Record<string, string>)[color.slice(6, -1)] ?? c['series-neutral'])
              : color
            return {
              name: getToolConfig(t.tool_name).shortLabel,
              value: t.total_calls,
              itemStyle: { color: resolved },
            }
          }),
        },
      ],
    }),
    [used],
  )

  const heat = useMemo(() => {
    const cells = (activity.data?.tool_heatmap ?? []).filter(
      (cell) => !filters.tool || cell.tool_name === filters.tool,
    )
    const grid = new Map<string, number>()
    cells.forEach((cell) =>
      grid.set(`${cell.weekday}-${cell.hour}`, (grid.get(`${cell.weekday}-${cell.hour}`) ?? 0) + cell.count),
    )
    const data: [number, number, number][] = []
    for (let d = 0; d < 7; d += 1)
      for (let h = 0; h < 24; h += 1) data.push([h, d, grid.get(`${d}-${h}`) ?? 0])
    return { data, max: Math.max(1, ...data.map((d) => d[2])), total: cells.reduce((s, c) => s + c.count, 0) }
  }, [activity.data, filters.tool])

  const heatOption = useCallback<ThemedOption>(
    (c) => ({
      tooltip: {
        position: 'top',
        formatter: (p: unknown) => {
          const v = (p as { value: [number, number, number] }).value
          return `${days[v[1]]} ${String(v[0]).padStart(2, '0')}:00 UTC<br/><b>${v[2]}</b> calls`
        },
      },
      grid: { left: 44, right: 12, top: 8, bottom: 56 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')),
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: c['chart-axis'], fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: days,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: c['chart-axis'], fontSize: 11 },
      },
      visualMap: {
        min: 0,
        max: heat.max,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 12,
        itemHeight: 120,
        textStyle: { color: c['chart-axis'], fontSize: 10 },
        inRange: { color: c.sequential },
      },
      series: [
        {
          type: 'heatmap',
          data: heat.data,
          itemStyle: { borderColor: c['chart-surface'], borderWidth: 2, borderRadius: 4 },
          emphasis: { itemStyle: { borderColor: c['chart-ink'], borderWidth: 2 } },
        },
      ],
    }),
    [heat],
  )

  return (
    <Section
      id="tools"
      description="Per-tool reliability, speed and evaluator judgments. New tools registered in the backend appear here automatically."
    >
      {tools.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : tools.error ? (
        <div className="glass rounded-[var(--radius-card)]">
          <ErrorState error={tools.error} onRetry={() => tools.refetch()} />
        </div>
      ) : !list.length ? (
        <div className="glass rounded-[var(--radius-card)]">
          <EmptyState title="No tools registered" />
        </div>
      ) : (
        <motion.div variants={stagger(0.05)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <ToolCard
              key={t.tool_name}
              stats={t}
              dimmed={Boolean(filters.tool) && filters.tool !== t.tool_name}
            />
          ))}
        </motion.div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Success vs failure per tool"
          info="Successful and failed executions for each tool in the period."
          loading={tools.isPending}
          error={tools.error}
          onRetry={() => tools.refetch()}
          empty={!outcome.length}
          csv={() => outcome}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={outcome}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="22%"
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="tool" {...axisProps} />
              <YAxis {...axisProps} width={36} allowDecimals={false} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
              <Legend {...legendProps} />
              <Bar dataKey="Successful" fill="var(--series-3)" radius={[4, 4, 0, 0]} {...anim} />
              <Bar dataKey="Failed" fill="var(--series-1)" radius={[4, 4, 0, 0]} {...anim} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Execution time per tool"
          info="Median (p50) and 95th percentile (p95) execution time. A wide gap means occasional slow calls."
          loading={tools.isPending}
          error={tools.error}
          onRetry={() => tools.refetch()}
          empty={!timing.length}
          csv={() => timing}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={timing}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="22%"
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="tool" {...axisProps} />
              <YAxis {...axisProps} width={56} tickFormatter={(v) => formatDuration(v)} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip formatter={(v) => formatDuration(v)} />} />
              <Legend {...legendProps} />
              <Bar dataKey="p50" name="p50" fill="var(--series-2)" radius={[4, 4, 0, 0]} {...anim} />
              <Bar dataKey="p95" name="p95" fill="var(--series-4)" radius={[4, 4, 0, 0]} {...anim} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-2"
          title="Tool usage share"
          info="Area is proportional to each tool's share of all calls."
          loading={tools.isPending}
          error={tools.error}
          onRetry={() => tools.refetch()}
          empty={!used.length}
          csv={() => used.map((t) => ({ tool: t.tool_name, calls: t.total_calls }))}
          height={280}
        >
          <LazyEChart option={treemapOption} height={280} ariaLabel="Treemap of tool usage share" />
        </ChartCard>
        <ChartCard
          className="xl:col-span-3"
          title="Tool usage by day and hour"
          subtitle={filters.tool ? `Filtered to ${getToolConfig(filters.tool).label}` : 'All tools, UTC'}
          info="Darker cells mean more tool calls in that weekday and hour (UTC). Use the tool filter to isolate one tool."
          loading={activity.isPending}
          error={activity.error}
          onRetry={() => activity.refetch()}
          empty={!heat.total}
          csv={() =>
            heat.data.filter((d) => d[2]).map(([hour, day, count]) => ({ day: days[day], hour, count }))
          }
          height={280}
        >
          <LazyEChart
            option={heatOption}
            height={280}
            ariaLabel="Heatmap of tool usage by weekday and hour"
          />
        </ChartCard>
      </div>
      <ChartCard
        title="Incorrect selection and unreliable output"
        info="Evaluator judgments per tool: picked when another tool fit better, output judged unreliable, or output that led to false information in the answer."
        loading={tools.isPending}
        error={tools.error}
        onRetry={() => tools.refetch()}
        empty={
          !quality.some((q) => q['Wrong selection'] + q['Unreliable output'] + q['False information'] > 0)
        }
        emptyTitle="No tool issues flagged"
        emptyDescription="The evaluator has not flagged any wrong tool choices or unreliable outputs in this period."
        csv={() => quality}
        height={240}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={quality}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            barCategoryGap="24%"
          >
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} allowDecimals={false} />
            <YAxis type="category" dataKey="tool" {...axisProps} width={84} />
            <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
            <Legend {...legendProps} />
            <Bar
              dataKey="Wrong selection"
              stackId="q"
              fill="var(--series-5)"
              stroke="var(--chart-surface)"
              strokeWidth={2}
              {...anim}
            />
            <Bar
              dataKey="Unreliable output"
              stackId="q"
              fill="var(--series-4)"
              stroke="var(--chart-surface)"
              strokeWidth={2}
              {...anim}
            />
            <Bar
              dataKey="False information"
              stackId="q"
              fill="var(--series-1)"
              stroke="var(--chart-surface)"
              strokeWidth={2}
              radius={[0, 4, 4, 0]}
              {...anim}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  )
}
