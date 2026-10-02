import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Boxes, FileText, Percent, Search, Sigma } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, cursorStyle, gridProps, legendProps } from '@/components/charts/theme'
import { Gauge } from '@/components/ui/Gauge'
import { StatCard } from '@/components/ui/StatCard'
import { formatNumber, formatPercent, truncate } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import { useActivity, useRag } from '../hooks'
import { Section } from '../components/Section'
import { dayTick, useChartAnimation } from '../components/chartHelpers'

const seq = [
  'var(--seq-1)',
  'var(--seq-1)',
  'var(--seq-2)',
  'var(--seq-2)',
  'var(--seq-3)',
  'var(--seq-3)',
  'var(--seq-4)',
  'var(--seq-4)',
  'var(--seq-5)',
]

export default function RagSection() {
  const rag = useRag()
  const activity = useActivity()
  const anim = useChartAnimation()
  const r = rag.data

  const perDoc = useMemo(
    () =>
      (r?.top_documents ?? []).map((d) => ({
        name: truncate(d.document_name, 28),
        hits: d.retrieval_hits,
        avg: d.avg_score ?? 0,
      })),
    [r],
  )
  const scores = useMemo(
    () => (r?.score_distribution ?? []).map((d) => ({ bucket: d.key ?? '', count: d.count })),
    [r],
  )
  const daily = useMemo(
    () =>
      (activity.data?.retrieval_daily ?? []).map((d) => ({
        date: d.date,
        Successful: d.successful,
        Failed: d.retrievals - d.successful,
        rate: d.success_rate,
      })),
    [activity.data],
  )
  const maxChunk = Math.max(1, ...(r?.top_chunks ?? []).map((c) => c.retrieval_count))

  return (
    <Section
      id="rag"
      description="How well retrieval over your uploaded PDFs is working: coverage, similarity and success."
    >
      <motion.div variants={stagger(0.05)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Documents"
          value={r?.documents}
          icon={<FileText className="size-4" />}
          loading={rag.isPending}
          hint={r ? `${formatNumber(r.total_pages)} pages` : undefined}
          info="Uploaded PDF documents."
        />
        <StatCard
          label="Chunks"
          value={r?.total_chunks}
          icon={<Boxes className="size-4" />}
          loading={rag.isPending}
          hint={r ? `${Math.round(r.avg_chunk_chars)} chars avg` : undefined}
          info="Text chunks embedded into the vector database."
        />
        <StatCard
          label="Retrieval success"
          value={r?.retrieval_success_rate}
          format={(v) => formatPercent(v)}
          icon={<Percent className="size-4" />}
          loading={rag.isPending}
          info="Retrievals where at least one chunk scored above the relevance threshold."
          spark={daily.map((d) => d.rate)}
          sparkColor="var(--series-3)"
        />
        <StatCard
          label="Avg similarity"
          value={r?.avg_score ?? undefined}
          format={(v) => v.toFixed(3)}
          icon={<Sigma className="size-4" />}
          loading={rag.isPending}
          hint={r?.avg_top_score != null ? `top hit ${r.avg_top_score.toFixed(3)}` : undefined}
          info="Mean cosine similarity of all retrieved chunks."
        />
        <StatCard
          label="Total retrievals"
          value={r?.retrievals}
          icon={<Search className="size-4" />}
          loading={rag.isPending}
          hint={r ? `${r.agent_retrievals} agent · ${r.api_retrievals} API` : undefined}
          info="Vector searches run by the agent or the search API."
          spark={daily.map((d) => d.Successful + d.Failed)}
        />
      </motion.div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Retrieval frequency per document"
          info="How often chunks from each document were returned by retrieval."
          loading={rag.isPending}
          error={rag.error}
          onRetry={() => rag.refetch()}
          empty={!perDoc.length}
          csv={() => perDoc}
          height={260}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={perDoc}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...axisProps} width={150} interval={0} />
              <Tooltip cursor={cursorStyle} content={<ChartTooltip />} />
              <Bar
                dataKey="hits"
                name="Retrieval hits"
                fill="var(--series-3)"
                maxBarSize={36}
                radius={[0, 4, 4, 0]}
                label={{ position: 'right', fill: 'var(--chart-ink)', fontSize: 11 }}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Chunk coverage"
          info="Share of all chunks that have been retrieved at least once. Low coverage means much of the corpus is never used."
          loading={rag.isPending}
          error={rag.error}
          onRetry={() => rag.refetch()}
          empty={!r?.total_chunks}
          png={false}
          height={220}
        >
          {(visible) =>
            visible && r ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex h-full flex-col items-center justify-center gap-2 pt-4"
              >
                <Gauge
                  value={r.chunk_coverage_rate}
                  label="Chunks retrieved at least once"
                  caption={`${r.chunks_retrieved_at_least_once} used · ${r.chunks_never_retrieved} never`}
                  color="var(--series-3)"
                  size={200}
                />
              </motion.div>
            ) : (
              <div style={{ height: 220 }} />
            )
          }
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Similarity score distribution"
          info="Every retrieved chunk bucketed by cosine similarity. Darker bars are higher similarity."
          loading={rag.isPending}
          error={rag.error}
          onRetry={() => rag.refetch()}
          empty={!scores.some((s) => s.count)}
          csv={() => scores}
          height={240}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scores} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="10%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip
                cursor={cursorStyle}
                content={<ChartTooltip labelFormatter={(l) => `Similarity ${l}`} />}
              />
              <Bar dataKey="count" name="Chunks" radius={[4, 4, 0, 0]} {...anim}>
                {scores.map((s, i) => (
                  <Cell key={s.bucket} fill={seq[i] ?? 'var(--seq-5)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Retrieval success over time"
          info="Daily retrievals that found at least one relevant chunk, versus those that did not."
          loading={activity.isPending}
          error={activity.error}
          onRetry={() => activity.refetch()}
          empty={!daily.length}
          csv={() => daily}
          height={240}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={dayTick} minTickGap={24} />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip
                cursor={cursorStyle}
                content={<ChartTooltip labelFormatter={(x) => dayTick(String(x))} />}
              />
              <Legend {...legendProps} />
              <Bar
                dataKey="Successful"
                stackId="r"
                fill="var(--series-3)"
                stroke="var(--chart-surface)"
                strokeWidth={2}
                {...anim}
              />
              <Bar
                dataKey="Failed"
                stackId="r"
                fill="var(--series-1)"
                stroke="var(--chart-surface)"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard
        title="Most retrieved chunks"
        info="The chunks the agent leans on most, with a preview of their text."
        loading={rag.isPending}
        error={rag.error}
        onRetry={() => rag.refetch()}
        empty={!r?.top_chunks.length}
        png={false}
        csv={() => (r?.top_chunks ?? []).map((c) => ({ ...c }))}
        height={120}
      >
        <motion.ol variants={stagger(0.04)} initial="hidden" animate="show" className="space-y-2">
          {(r?.top_chunks ?? []).map((chunk, index) => (
            <motion.li
              key={chunk.chunk_id}
              variants={fadeUp}
              className="bg-surface-strong/70 flex items-start gap-3 rounded-xl p-3"
            >
              <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold">{chunk.document_name}</span>
                  <span className="text-ink-muted">
                    p. {chunk.page_start} · chunk #{chunk.chunk_id}
                  </span>
                </div>
                <p className="text-ink-muted mt-1 line-clamp-2 text-xs leading-relaxed">{chunk.preview}</p>
              </div>
              <div className="w-28 shrink-0 text-right">
                <div className="font-mono text-sm font-bold">{chunk.retrieval_count}×</div>
                <div className="bg-charcoal-900/10 dark:bg-cream/10 mt-1 h-1.5 overflow-hidden rounded-full">
                  <motion.div
                    className="h-full rounded-full bg-[var(--series-3)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(chunk.retrieval_count / maxChunk) * 100}%` }}
                    transition={{ duration: 0.9 }}
                  />
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </ChartCard>
    </Section>
  )
}
