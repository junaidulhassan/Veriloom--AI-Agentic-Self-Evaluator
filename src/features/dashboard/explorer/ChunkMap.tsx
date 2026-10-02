import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from '@/components/ui/Tooltip'
import type { ChunkOut } from '@/types/api'

const scale = ['var(--seq-0)', 'var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)']

export const ChunkMap = memo(function ChunkMap({
  chunks,
  onSelect,
  selectedPage,
}: {
  chunks: ChunkOut[]
  onSelect: (page: number) => void
  selectedPage?: number | null
}) {
  const { pages, max } = useMemo(() => {
    const byPage = new Map<number, ChunkOut[]>()
    chunks.forEach((chunk) => byPage.set(chunk.page_start, [...(byPage.get(chunk.page_start) ?? []), chunk]))
    return {
      pages: [...byPage.entries()].sort((a, b) => a[0] - b[0]),
      max: Math.max(1, ...chunks.map((c) => c.retrieval_count)),
    }
  }, [chunks])
  const color = (count: number) =>
    count === 0
      ? scale[0]
      : scale[Math.min(scale.length - 1, 1 + Math.floor((count / max) * (scale.length - 2)))]
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="list" aria-label="Chunk map by page">
        {pages.map(([page, items], pageIndex) => (
          <motion.button
            key={page}
            type="button"
            role="listitem"
            onClick={() => onSelect(page)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(pageIndex * 0.01, 0.6) }}
            className={`hover:bg-charcoal-900/[0.06] flex flex-col items-center gap-0.5 rounded-lg p-1 transition-colors ${selectedPage === page ? 'ring-charcoal-900 dark:ring-coral-400 ring-2' : ''}`}
            aria-label={`Page ${page}: ${items.length} chunks`}
          >
            <span className="flex gap-0.5">
              {items.map((chunk) => (
                <Tooltip key={chunk.id} content={`Chunk #${chunk.id} · retrieved ${chunk.retrieval_count}×`}>
                  <span
                    className="block h-6 w-2.5 rounded-[3px] ring-1 ring-black/5"
                    style={{ background: color(chunk.retrieval_count) }}
                  />
                </Tooltip>
              ))}
            </span>
            <span className="text-ink-muted font-mono text-[9.5px]">{page}</span>
          </motion.button>
        ))}
      </div>
      <div className="text-ink-muted mt-3 flex items-center gap-2 text-[11px]">
        <span>Never retrieved</span>
        <span className="flex gap-0.5">
          {scale.map((c) => (
            <span
              key={c}
              className="block h-2.5 w-5 rounded-sm ring-1 ring-black/5"
              style={{ background: c }}
            />
          ))}
        </span>
        <span>Most retrieved ({max}×)</span>
      </div>
    </div>
  )
})
