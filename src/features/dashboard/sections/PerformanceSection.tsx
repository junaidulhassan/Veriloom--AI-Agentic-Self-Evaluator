import { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Brain, Repeat2, Target, Workflow } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { LazyEChart, type ThemedOption } from '@/components/charts/LazyEChart'
import { axisProps, cursorStyle, gridProps } from '@/components/charts/theme'
import { StatCard } from '@/components/ui/StatCard'
import { clamp } from '@/lib/utils'
import { formatDuration, formatPercent } from '@/lib/format'
import { stagger } from '@/lib/motion'
import { useActivity, useAgentPerformance, useOverview, useResponseQuality } from '../hooks'
import { Section } from '../components/Section'
import { useChartAnimation } from '../components/chartHelpers'

export default function PerformanceSection() {
  const perf = useAgentPerformance()
  const quality = useResponseQuality()
  const overview = useOverview()
  const activity = useActivity()
  const anim = useChartAnimation()
  const p = perf.data

  const radar = useMemo(() => {
    if (!p) return null
    const speed = p.latency.count ? clamp(100 * (1 - p.latency.p50 / 30000), 0, 100) : 0
    return [
      { name: 'Accuracy', value: p.accuracy_rate },
      { name: 'Relevance', value: quality.data?.relevance_rate ?? 0 },
      { name: 'Tool success', value: overview.data?.tool_success_rate ?? 0 },
      { name: 'Self-correction', value: p.retry_success_rate },
      { name: 'Speed', value: Number(speed.toFixed(1)) },
      { name: 'Reliability', value: Number((100 - p.failure_rate).toFixed(1)) },
    ]
  }, [p, quality.data, overview.data])

  const radarOption = useCallback<ThemedOption>(
    (c) => ({
      tooltip: { trigger: 'item' },
      radar: {
        indicator: (radar ?? []).map((d) => ({ name: d.name, max: 100 })),
        radius: '68%',
        splitNumber: 4,
        axisName: { color: c['chart-axis'], fontSize: 11, fontWeight: 600 },
        splitLine: { lineStyle: { color: c['chart-grid'] } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: c['chart-grid'] } },
      },
      series: [
        {
          type: 'radar',
          symbolSize: 7,
          data: [{ value: (radar ?? []).map((d) => d.value), name: 'Agent score' }],
          lineStyle: { color: c['series-1'], width: 2 },
          itemStyle: { color: c['series-1'], borderColor: c['chart-surface'], borderWidth: 2 },
          areaStyle: { color: c['series-1'], opacity: 0.22 },
        },
      ],
    }),
    [radar],
  )

  const funnel = useMemo(() => {
    if (!p) return []
    const evaluated = quality.data?.evaluated ?? 0
    const retried = quality.data?.retried ?? Math.round((p.retry_rate / 100) * p.total_questions)
    const firstFail = evaluated ? Math.round(evaluated * (1 - p.evaluator_pass_rate_first_attempt / 100)) : 0
    return [
      { name: 'Initial responses', value: p.total_questions },
      { name: 'Evaluation failed', value: Math.max(firstFail, retried) },
      { name: 'Retried', value: retried },
      {
        name: 'Corrected',
        value: quality.data?.self_corrected ?? Math.round((p.self_correction_rate / 100) * p.total_questions),
      },
    ]
  }, [p, quality.data])

  const funnelOption = useCallback<ThemedOption>(
    (c) => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: [
        {
          type: 'funnel',
          left: '6%',
          width: '88%',
          top: 8,
          bottom: 8,
          minSize: '18%',
          gap: 4,
          sort: 'descending',
          label: {
            show: true,
            position: 'inside',
            color: '#fff8f5',
            fontWeight: 700,
            fontSize: 12,
            formatter: '{b}\n{c}',
          },
          itemStyle: { borderColor: c['chart-surface'], borderWidth: 2, borderRadius: 8 },
          data: funnel.map((d, i) => ({
            ...d,
            itemStyle: { color: [c['series-2'], c['series-1'], c['series-5'], c['series-3']][i] },
          })),
        },
      ],
    }),
    [funnel],
  )

  const toolDist = useMemo(
    () => Object.entries(p?.tool_calls_distribution ?? {}).map(([calls, count]) => ({ calls, count })),
    [p],
  )
  const retryDist = useMemo(
    () => (activity.data?.retry_distribution ?? []).map((d) => ({ retries: d.key ?? '0', count: d.count })),
    [activity.data],
  )

  return (
    <Section
      id="performance"
      description="How efficiently the agent reaches a verified answer: retries, tool usage and evaluator pass rates."
    >
      <motion.div variants={stagger(0.05)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Avg attempts"
          value={p?.avg_attempts}
          format={(v) => v.toFixed(2)}
          icon={<Repeat2 className="size-4" />}
          loading={perf.isPending}
          info="Mean answer attempts per question; 1.00 means no retries."
          hint={p ? `${formatPercent(p.retry_rate)} retried` : undefined}
        />
        <StatCard
          label="First-pass approval"
          value={p?.evaluator_pass_rate_first_attempt}
          format={(v) => formatPercent(v)}
          icon={<Target className="size-4" />}
          loading={perf.isPending}
          info="Share of first attempts the evaluator accepted without asking for a retry."
        />
        <StatCard
          label="Tool selection accuracy"
          value={p?.tool_selection_accuracy}
          format={(v) => formatPercent(v)}
          icon={<Workflow className="size-4" />}
          loading={perf.isPending}
          info="Share of assessed tool calls the evaluator judged an appropriate choice."
        />
        <StatCard
          label="LLM calls per question"
          value={p?.avg_llm_calls_per_question}
          format={(v) => v.toFixed(2)}
          icon={<Brain className="size-4" />}
          loading={perf.isPending}
          info="Mean agent and evaluator LLM calls per question."
          hint={p ? `p50 ${formatDuration(p.latency.p50)}` : undefined}
        />
      </motion.div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Capability radar"
          info="Six normalized scores from 0 to 100. Speed maps median latency onto 0 to 30 seconds (faster is higher). Self-correction is the share of retried questions that ended corrected. Reliability is 100 minus the failure rate."
          loading={perf.isPending}
          error={perf.error}
          onRetry={() => perf.refetch()}
          empty={!p?.total_questions}
          csv={() => radar ?? []}
          height={300}
        >
          <LazyEChart option={radarOption} height={300} ariaLabel="Radar chart of agent capability scores" />
        </ChartCard>
        <ChartCard
          title="Self-correction funnel"
          info="From every initial response, how many failed evaluation, were retried, and ended with a corrected answer."
          loading={perf.isPending}
          error={perf.error}
          onRetry={() => perf.refetch()}
          empty={!p?.total_questions}
          csv={() => funnel}
          height={300}
        >
          <LazyEChart option={funnelOption} height={300} ariaLabel="Funnel chart of self-correction stages" />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tool calls per question"
          info="Histogram of how many tools the agent used to answer each question."
          loading={perf.isPending}
          error={perf.error}
          onRetry={() => perf.refetch()}
          empty={!toolDist.length}
          csv={() => toolDist}
          height={240}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={toolDist} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="calls"
                {...axisProps}
                label={{
                  value: 'tool calls',
                  position: 'insideBottomRight',
                  offset: -2,
                  fill: 'var(--chart-axis)',
                  fontSize: 11,
                }}
              />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip
                cursor={cursorStyle}
                content={<ChartTooltip labelFormatter={(l) => `${l} tool calls`} />}
              />
              <Bar
                dataKey="count"
                name="Questions"
                fill="var(--series-2)"
                maxBarSize={64}
                radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: 'var(--chart-ink)', fontSize: 11 }}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Retry count distribution"
          info="How many retries each question needed before the evaluator accepted an answer or the retry budget ran out."
          loading={activity.isPending}
          error={activity.error}
          onRetry={() => activity.refetch()}
          empty={!retryDist.length}
          csv={() => retryDist}
          height={240}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={retryDist}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="18%"
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="retries"
                {...axisProps}
                label={{
                  value: 'retries',
                  position: 'insideBottomRight',
                  offset: -2,
                  fill: 'var(--chart-axis)',
                  fontSize: 11,
                }}
              />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip
                cursor={cursorStyle}
                content={<ChartTooltip labelFormatter={(l) => `${l} retries`} />}
              />
              <Bar
                dataKey="count"
                name="Questions"
                fill="var(--series-4)"
                maxBarSize={64}
                radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: 'var(--chart-ink)', fontSize: 11 }}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Section>
  )
}
