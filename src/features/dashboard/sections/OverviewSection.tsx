import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CheckCircle2,
  Coins,
  Gauge,
  MessageSquareText,
  Repeat2,
  ShieldAlert,
  Timer,
  Wrench,
} from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, cursorStyle, gridProps, lineCursor } from '@/components/charts/theme'
import { StatCard } from '@/components/ui/StatCard'
import { formatDuration, formatNumber, formatPercent } from '@/lib/format'
import { stagger } from '@/lib/motion'
import { percentChange } from '../filters'
import { useOverview, usePreviousOverview, useTimeseries } from '../hooks'
import { Section } from '../components/Section'
import { dayTick, rate, useChartAnimation } from '../components/chartHelpers'

export default function OverviewSection() {
  const overview = useOverview()
  const previous = usePreviousOverview()
  const timeseries = useTimeseries()
  const anim = useChartAnimation()
  const o = overview.data
  const p = previous.data
  const ts = useMemo(() => timeseries.data ?? [], [timeseries.data])

  const sparks = useMemo(
    () => ({
      questions: ts.map((d) => d.questions),
      accuracy: ts.map((d) => rate(d.correct, d.correct + d.incorrect)),
      hallucination: ts.map((d) => rate(d.hallucinated, d.correct + d.incorrect)),
      tools: ts.map((d) => rate(d.tool_calls - d.tool_failures, d.tool_calls)),
      corrected: ts.map((d) => rate(d.self_corrected, d.questions)),
      latency: ts.map((d) => d.avg_latency_ms),
      tokens: ts.map((d) => d.tokens),
      toolCalls: ts.map((d) => d.tool_calls),
    }),
    [ts],
  )

  const series = useMemo(
    () =>
      ts.map((d) => ({
        date: d.date,
        questions: d.questions,
        accuracy: Number(rate(d.correct, d.correct + d.incorrect).toFixed(1)),
        latency: Math.round(d.avg_latency_ms),
      })),
    [ts],
  )

  const loading = overview.isPending
  const cards = [
    {
      label: 'Total questions',
      value: o?.total_questions,
      icon: <MessageSquareText className="size-4" />,
      delta: percentChange(o?.total_questions, p?.total_questions),
      spark: sparks.questions,
      info: 'Agent requests received in the selected period.',
      hint: o ? `${formatNumber(o.total_conversations)} sessions` : undefined,
    },
    {
      label: 'Overall accuracy',
      value: o?.accuracy_rate,
      format: (v: number) => formatPercent(v),
      icon: <CheckCircle2 className="size-4" />,
      delta: percentChange(o?.accuracy_rate, p?.accuracy_rate),
      spark: sparks.accuracy,
      info: 'Share of evaluated answers the self-evaluator judged correct.',
      color: 'var(--series-3)',
    },
    {
      label: 'Hallucination rate',
      value: o?.hallucination_rate,
      format: (v: number) => formatPercent(v),
      icon: <ShieldAlert className="size-4" />,
      delta: percentChange(o?.hallucination_rate, p?.hallucination_rate),
      good: 'down' as const,
      spark: sparks.hallucination,
      info: 'Share of evaluated final answers flagged as containing fabricated or unsupported claims.',
    },
    {
      label: 'Tool success rate',
      value: o?.tool_success_rate,
      format: (v: number) => formatPercent(v),
      icon: <Wrench className="size-4" />,
      delta: percentChange(o?.tool_success_rate, p?.tool_success_rate),
      spark: sparks.tools,
      info: 'Tool executions that completed without an error.',
      color: 'var(--series-2)',
    },
    {
      label: 'Self-correction rate',
      value: o?.self_correction_rate,
      format: (v: number) => formatPercent(v),
      icon: <Repeat2 className="size-4" />,
      delta: percentChange(o?.self_correction_rate, p?.self_correction_rate),
      spark: sparks.corrected,
      info: 'Questions where the evaluator rejected the first answer and a retry produced a passing answer.',
      color: 'var(--series-4)',
    },
    {
      label: 'Average latency',
      value: o?.avg_latency_ms,
      format: (v: number) => formatDuration(v),
      icon: <Timer className="size-4" />,
      delta: percentChange(o?.avg_latency_ms, p?.avg_latency_ms),
      good: 'down' as const,
      spark: sparks.latency,
      info: 'Mean end-to-end time per request, including tools, retries and evaluation.',
      color: 'var(--series-5)',
    },
    {
      label: 'Total tokens',
      value: o?.total_tokens,
      format: (v: number) => formatNumber(v, { compact: true }),
      icon: <Coins className="size-4" />,
      delta: percentChange(o?.total_tokens, p?.total_tokens),
      good: 'down' as const,
      spark: sparks.tokens,
      info: 'Input plus output tokens across agent, finalize and evaluator LLM calls.',
      color: 'var(--series-6)',
    },
    {
      label: 'Total tool calls',
      value: o?.total_tool_calls,
      icon: <Gauge className="size-4" />,
      delta: percentChange(o?.total_tool_calls, p?.total_tool_calls),
      spark: sparks.toolCalls,
      info: 'Number of tool executions requested by the agent.',
      hint: o ? `${o.avg_tool_calls_per_question.toFixed(2)} per question` : undefined,
      color: 'var(--series-2)',
    },
  ]

  return (
    <Section
      id="overview"
      description="Headline health of the agent for the selected period, compared with the period before."
    >
      {overview.error ? (
        <ChartCard title="Overview" error={overview.error} onRetry={() => overview.refetch()} png={false}>
          {null}
        </ChartCard>
      ) : (
        <motion.div variants={stagger(0.05)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              format={card.format}
              icon={card.icon}
              delta={card.delta}
              goodDirection={card.good ?? 'up'}
              spark={card.spark}
              sparkColor={card.color ?? 'var(--series-1)'}
              info={card.info}
              hint={card.hint}
              loading={loading}
            />
          ))}
        </motion.div>
      )}
      <ChartCard
        title="Questions, accuracy and latency over time"
        info="Three aligned panels sharing one timeline: daily question volume, the share of evaluated answers judged correct, and mean request latency. Hover any panel to read all three for that day."
        loading={timeseries.isPending}
        error={timeseries.error}
        onRetry={() => timeseries.refetch()}
        empty={!series.length}
        csv={() => series}
        height={420}
      >
        <div className="space-y-1">
          {[
            {
              key: 'questions',
              label: 'Questions',
              color: 'var(--series-1)',
              fmt: (v: number) => formatNumber(v),
              bar: true,
            },
            {
              key: 'accuracy',
              label: 'Accuracy',
              color: 'var(--series-3)',
              fmt: (v: number) => `${v}%`,
              domain: [0, 100] as [number, number],
            },
            {
              key: 'latency',
              label: 'Avg latency',
              color: 'var(--series-2)',
              fmt: (v: number) => formatDuration(v),
            },
          ].map((panel, index, all) => (
            <div key={panel.key}>
              <div className="text-ink-soft flex items-center gap-1.5 pl-1 text-[11.5px] font-semibold">
                <span className="size-2 rounded-full" style={{ background: panel.color }} aria-hidden />
                {panel.label}
              </div>
              <ResponsiveContainer width="100%" height={index === all.length - 1 ? 128 : 112}>
                <ComposedChart
                  data={series}
                  syncId="overview-ts"
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    dataKey="date"
                    {...axisProps}
                    tickFormatter={dayTick}
                    hide={index !== all.length - 1}
                    minTickGap={24}
                  />
                  <YAxis
                    {...axisProps}
                    width={56}
                    tickFormatter={(v) =>
                      panel.key === 'latency'
                        ? formatDuration(v)
                        : panel.key === 'accuracy'
                          ? `${v}%`
                          : formatNumber(v, { compact: true })
                    }
                    domain={panel.domain ?? [0, 'auto']}
                    tickCount={3}
                  />
                  <Tooltip
                    cursor={panel.bar ? cursorStyle : lineCursor}
                    content={
                      <ChartTooltip
                        labelFormatter={(l) => dayTick(String(l))}
                        formatter={(v) => panel.fmt(v)}
                      />
                    }
                  />
                  {panel.bar ? (
                    <Bar
                      dataKey={panel.key}
                      name={panel.label}
                      fill={panel.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                      {...anim}
                    />
                  ) : (
                    <Line
                      dataKey={panel.key}
                      name={panel.label}
                      stroke={panel.color}
                      strokeWidth={2}
                      dot={
                        series.length < 20 ? { r: 3, strokeWidth: 2, fill: 'var(--chart-surface)' } : false
                      }
                      activeDot={{ r: 5 }}
                      type="monotone"
                      {...anim}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </ChartCard>
    </Section>
  )
}
