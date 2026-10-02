import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChunkOut } from '@/types/api'
import { ChunkCard } from './ChunkCard'

export function VirtualChunkList({
  chunks,
  term,
  onDelete,
  showDocument,
  height = 560,
}: {
  chunks: ChunkOut[]
  term?: string
  onDelete?: (chunk: ChunkOut) => void
  showDocument?: boolean
  height?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const max = Math.max(1, ...chunks.map((c) => c.retrieval_count))
  const virtualizer = useVirtualizer({
    count: chunks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 170,
    overscan: 5,
    getItemKey: (index) => chunks[index]?.id ?? index,
  })
  return (
    <div
      ref={parentRef}
      className="overflow-y-auto rounded-2xl pr-1"
      style={{ maxHeight: height }}
      role="list"
      aria-label="Chunks"
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            role="listitem"
            className="absolute top-0 left-0 w-full pb-2"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            <ChunkCard
              chunk={chunks[row.index]}
              term={term}
              maxRetrieval={max}
              onDelete={onDelete}
              showDocument={showDocument}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
