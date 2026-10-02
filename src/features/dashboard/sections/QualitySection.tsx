import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, cursorStyle, gridProps, legendProps, lineCursor } from '@/components/charts/theme'
import { Gauge } from '@/components/ui/Gauge'
import { CountUp } from '@/components/ui/CountUp'
import { formatNumber } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { useResponseQuality, useTimeseries } from '../hooks'
import { Section } from '../components/Section'
import { dayTick, useChartAnimation } from '../components/chartHelpers'

const categories = [
  { key: 'correct', label: 'Correct (first try)', color: 'var(--series-3)' },
  { key: 'self_corrected', label: 'Self-corrected', color: 'var(--series-2)' },
  { key: 'incorrect', label: 'Incorrect', color: 'var(--series-5)' },
  { key: 'hallucinated', label: 'Hallucinated', color: 'var(--series-1)' },
  { key: 'failed', label: 'Failed', color: 'var(--series-4)' },
  { key: 'unevaluated', label: 'Not evaluated', color: 'var(--series-neutral)' },
] as const

export default function QualitySection() {
  const quality = useResponseQuality()
  const timeseries = useTimeseries()
  const anim = useChartAnimation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const q = quality.data

  const donut = useMemo(() => {
    if (!q) return []
    const values: Record<string, number> = {
      correct: Math.max(0, q.correct - q.self_corrected),
      self_corrected: q.self_corrected,
      incorrect: Math.max(0, q.incorrect - q.hallucinated),
      hallucinated: q.hallucinated,
      failed: q.failed,
      unevaluated: Math.max(0, q.unevaluated - q.failed),
    }
    return categories
      .map((c) => ({ name: c.label, key: c.key, value: values[c.key], color: c.color }))
      .filter((d) => d.value > 0)
  }, [q])

  const stacked = useMemo(
    () =>
      (timeseries.data ?? []).map((d) => ({
        date: d.date,
        correct: Math.max(0, d.correct - d.self_corrected),
        self_corrected: d.self_corrected,
        incorrect: Math.max(0, d.incorrect - d.hallucinated),
        hallucinated: d.hallucinated,
        failed: d.failed,
      })),
    [timeseries.data],
  )

  const relevance = q
    ? [
        { name: 'Relevant', value: q.relevant, color: 'var(--series-3)' },
        { name: 'Irrelevant', value: q.irrelevant, color: 'var(--series-1)' },
        { name: 'Well written', value: q.well_written, color: 'var(--series-2)' },
      ]
    : []
  const total = donut.reduce((sum, d) => sum + d.value, 0)

  return (
    <Section
      id="quality"
      description="How good the final answers are, as judged by the self-evaluator on every request."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-2"
          title="Answer outcomes"
          info="Every question in the period lands in exactly one slice. Self-corrected answers are correct answers that needed a retry; hallucinated answers are split out of incorrect ones."
          loading={quality.isPending}
          error={quality.error}
          onRetry={() => quality.refetch()}
          empty={!total}
          csv={() => donut.map(({ name, value }) => ({ outcome: name, count: value }))}
          height={300}
        >
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="84%"
                  paddingAngle={2}
                  cornerRadius={6}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  activeShape={(props: unknown) => {
                    const p = props as { outerRadius: number } & Record<string, unknown>
                    return <Sector {...(p as object)} outerRadius={p.outerRadius + 6} />
                  }}
                  {...anim}
                >
                  {donut.map((d, index) => (
                    <Cell
                      key={d.key}
                      fill={d.color}
                      opacity={activeIndex == null || activeIndex === index ? 1 : 0.45}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => `${formatNumber(v)} (${((v / total) * 100).toFixed(1)}%)`}
                    />
                  }
                />
                <Legend {...legendProps} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-34px)] text-center">
              <CountUp value={total} className="font-sans text-3xl font-extrabold tabular-nums" />
              <div className="text-ink-muted text-[11px] font-semibold">questions</div>
            </div>
          </div>
        </ChartCard>
        <ChartCard
          className="xl:col-span-3"
          title="Quality over time"
          info="Daily answer outcomes stacked so the total height is the day's question volume."
          loading={timeseries.isPending}
          error={timeseries.error}
          onRetry={() => timeseries.refetch()}
          empty={
            !stacked.some((d) => d.correct + d.self_corrected + d.incorrect + d.hallucinated + d.failed > 0)
          }
          csv={() => stacked}
          height={300}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stacked} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={dayTick} minTickGap={24} />
              <YAxis {...axisProps} width={36} allowDecimals={false} />
              <Tooltip
                cursor={lineCursor}
                content={<ChartTooltip labelFormatter={(l) => dayTick(String(l))} />}
              />
              <Legend {...legendProps} />
              {categories.slice(0, 5).map((c) => (
                <Area
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  name={c.label}
                  stackId="q"
                  stroke={c.color}
                  strokeWidth={2}
                  fill={c.color}
                  fillOpacity={0.25}
                  {...anim}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title="Quality gauges"
          info="Accuracy, relevance and writing quality are shares of evaluated answers. Response quality is the evaluator's mean quality score."
          loading={quality.isPending}
          error={quality.error}
          onRetry={() => quality.refetch()}
          empty={!q?.evaluated}
          png={false}
          csv={() =>
            q
              ? [
                  {
                    accuracy: q.accuracy_rate,
                    relevance: q.relevance_rate,
                    well_written: q.well_written_rate,
                    response_quality: q.response_quality_rate,
                  },
                ]
              : []
          }
          height={200}
        >
          {(visible) =>
            visible && q ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4 md:grid-cols-4"
              >
                <Gauge
                  value={q.accuracy_rate}
                  label="Accuracy"
                  caption={`${q.correct} of ${q.evaluated}`}
                  color="var(--series-3)"
                />
                <Gauge
                  value={q.relevance_rate}
                  label="Relevant"
                  caption={`${q.relevant} of ${q.evaluated}`}
                  color="var(--series-2)"
                />
                <Gauge
                  value={q.well_written_rate}
                  label="Well written"
                  caption={`${q.well_written} of ${q.evaluated}`}
                  color="var(--series-4)"
                />
                <Gauge
                  value={q.response_quality_rate}
                  label="Response quality"
                  caption={`avg confidence ${(q.avg_confidence * 100).toFixed(0)}%`}
                  color="var(--series-1)"
                />
              </motion.div>
            ) : (
              <div style={{ height: 200 }} />
            )
          }
        </ChartCard>
        <ChartCard
          className="xl:col-span-2"
          title="Relevance and writing"
          info="Counts of evaluated answers judged relevant, irrelevant and well written."
          loading={quality.isPending}
          error={quality.error}
          onRetry={() => quality.refetch()}
          empty={!q?.evaluated}
          csv={() => relevance.map(({ name, value }) => ({ name, value }))}
          height={200}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={relevance}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              barCategoryGap={10}
            >
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...axisProps} width={86} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
              <Bar
                dataKey="value"
                name="Answers"
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
                label={{ position: 'right', fill: 'var(--chart-ink)', fontSize: 11, fontWeight: 600 }}
                {...anim}
              >
                {relevance.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Section>
  )
}
