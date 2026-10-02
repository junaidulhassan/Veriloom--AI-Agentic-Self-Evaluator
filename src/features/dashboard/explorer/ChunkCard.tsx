import { memo, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Cpu, Hash, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CodeBlock'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sparkline } from '@/components/ui/Sparkline'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ChunkOut } from '@/types/api'
import { Highlight } from './highlight'
import { useChunkDetail } from './useExplorer'

function RetrievalHistory({ chunkId }: { chunkId: number }) {
  const { data, isPending, error } = useChunkDetail(chunkId)
  if (isPending) return <Skeleton className="h-24" />
  if (error || !data) return <p className="text-error text-xs">Could not load retrieval history.</p>
  const history = [...data.retrieval_history].reverse()
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold">Retrieved {data.retrieval_stats.hits}×</span>
        {data.retrieval_stats.avg_score != null ? (
          <span className="text-ink-muted">
            avg {data.retrieval_stats.avg_score.toFixed(3)} · max {data.retrieval_stats.max_score?.toFixed(3)}{' '}
            · min {data.retrieval_stats.min_score?.toFixed(3)}
          </span>
        ) : null}
        {history.length > 1 ? (
          <span className="ml-auto w-32">
            <Sparkline
              values={history.map((h) => h.score)}
              color="var(--series-3)"
              height={28}
              label="Similarity score history"
            />
          </span>
        ) : null}
      </div>
      {data.retrieval_history.length ? (
        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {data.retrieval_history.map((record) => (
            <li
              key={record.retrieval_id}
              className="bg-surface-strong flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate" title={record.query}>
                {record.query}
              </span>
              <Badge size="xs" tone={record.is_relevant ? 'success' : 'neutral'}>
                #{record.rank}
              </Badge>
              <span className="font-mono tabular-nums">{record.score.toFixed(3)}</span>
              <span className="text-ink-muted hidden sm:inline">{formatDateTime(record.retrieved_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted text-xs">No user question has retrieved this chunk yet.</p>
      )}
    </div>
  )
}

export const ChunkCard = memo(function ChunkCard({
  chunk,
  term,
  maxRetrieval,
  onDelete,
  showDocument,
}: {
  chunk: ChunkOut
  term?: string
  maxRetrieval: number
  onDelete?: (chunk: ChunkOut) => void
  showDocument?: boolean
}) {
  const [open, setOpen] = useState(false)
  const text = chunk.text ?? chunk.preview ?? ''
  const excerpt = useMemo(() => {
    const needle = term
      ?.trim()
      .split(/\s+/)
      .find((w) => w.length > 1)
      ?.toLowerCase()
    if (!needle) return text
    const at = text.toLowerCase().indexOf(needle)
    if (at < 160) return text
    return `…${text.slice(Math.max(0, at - 120))}`
  }, [text, term])
  const pages =
    chunk.page_start === chunk.page_end
      ? `p. ${chunk.page_start}`
      : `pp. ${chunk.page_start}-${chunk.page_end}`
  const heat = maxRetrieval ? chunk.retrieval_count / maxRetrieval : 0
  return (
    <article className="border-line bg-surface-strong/80 rounded-2xl border p-3.5 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <header className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold">
          <Hash className="size-3" aria-hidden />
          {chunk.id}
        </span>
        <Badge size="xs" tone="outline">
          idx {chunk.chunk_index}
        </Badge>
        <Badge size="xs" tone="outline">
          {pages}
        </Badge>
        <Badge size="xs">
          {chunk.char_count} chars · ~{chunk.token_estimate} tok
        </Badge>
        {!chunk.is_indexed ? (
          <Badge size="xs" tone="warning">
            not indexed
          </Badge>
        ) : null}
        {showDocument && chunk.document_name ? (
          <Badge size="xs" tone="info" className="max-w-48">
            {chunk.document_name}
          </Badge>
        ) : null}
        <Tooltip content={`Retrieved ${chunk.retrieval_count} times`}>
          <span
            tabIndex={0}
            className="text-ink-muted ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold"
          >
            <span className="bg-charcoal-900/10 dark:bg-cream/10 h-1.5 w-14 overflow-hidden rounded-full">
              <span
                className="block h-full rounded-full bg-[var(--series-3)]"
                style={{ width: `${Math.max(heat * 100, chunk.retrieval_count ? 6 : 0)}%` }}
              />
            </span>
            {chunk.retrieval_count}×
          </span>
        </Tooltip>
        {onDelete ? (
          <Tooltip content="Delete chunk">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Delete chunk ${chunk.id}`}
              onClick={() => onDelete(chunk)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </Tooltip>
        ) : null}
      </header>
      <div
        className={cn(
          'text-ink-soft relative mt-2 text-[13px] leading-relaxed break-words whitespace-pre-wrap',
          !open && 'line-clamp-4',
        )}
      >
        <Highlight text={open ? text : excerpt} term={term} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="soft" size="xs" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ChevronDown className={cn('size-3 transition-transform', !open && '-rotate-90')} />
          {open ? 'Collapse' : 'Full text and retrievals'}
        </Button>
        <span className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
          <Cpu className="size-3" aria-hidden />
          {chunk.embedding_model} · {chunk.embedding_dimension}d
          {chunk.embedding_norm != null ? ` · norm ${chunk.embedding_norm.toFixed(3)}` : ''} · vec{' '}
          {chunk.vector_id}
        </span>
        {open ? (
          <CopyButton
            text={text}
            label="Copy text"
            className="text-ink-muted hover:bg-charcoal-900/10 hover:text-ink ml-auto"
          />
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-line mt-3 border-t pt-3">
              <div className="text-ink-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
                Questions that retrieved this chunk
              </div>
              <RetrievalHistory chunkId={chunk.id} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  )
})
