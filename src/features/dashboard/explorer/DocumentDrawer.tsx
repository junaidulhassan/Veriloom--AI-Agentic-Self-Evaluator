import { useDeferredValue, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, FileText, RefreshCcw, Trash2, X } from 'lucide-react'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, cursorStyle, gridProps } from '@/components/charts/theme'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { documentsApi } from '@/api/documents'
import { useDeleteDocument } from '@/features/documents/useDocuments'
import { formatBytes, formatDateTime, formatDuration, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ChunkOut } from '@/types/api'
import { useChartAnimation } from '../components/chartHelpers'
import { ChunkMap } from './ChunkMap'
import { VirtualChunkList } from './VirtualChunkList'
import { useAllChunks, useDeleteChunk, useDocumentDetail, useReindex } from './useExplorer'

type Mode = 'all' | 'retrieved' | 'never' | 'top'

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-surface-strong rounded-xl px-3 py-2">
      <div className="text-ink-muted text-[10.5px] font-bold tracking-wider uppercase">{label}</div>
      <div
        className={cn('mt-0.5 truncate text-[13px] font-semibold', mono && 'font-mono text-xs')}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}

export function DocumentDrawer({ documentId, onClose }: { documentId: string | null; onClose: () => void }) {
  const detail = useDocumentDetail(documentId)
  const chunks = useAllChunks(documentId)
  const deleteDoc = useDeleteDocument()
  const deleteChunk = useDeleteChunk(documentId)
  const reindex = useReindex()
  const anim = useChartAnimation()
  const [search, setSearch] = useState('')
  const term = useDeferredValue(search)
  const [mode, setMode] = useState<Mode>('all')
  const [page, setPage] = useState<number | null>(null)
  const [confirmDoc, setConfirmDoc] = useState(false)
  const [confirmReindex, setConfirmReindex] = useState(false)
  const [chunkTarget, setChunkTarget] = useState<ChunkOut | null>(null)
  const d = detail.data

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase()
    let list = chunks.chunks
    if (page != null) list = list.filter((c) => c.page_start <= page && c.page_end >= page)
    if (mode === 'retrieved') list = list.filter((c) => c.retrieval_count > 0)
    if (mode === 'never') list = list.filter((c) => c.retrieval_count === 0)
    if (needle) list = list.filter((c) => (c.text ?? '').toLowerCase().includes(needle))
    if (mode === 'top') list = [...list].sort((a, b) => b.retrieval_count - a.retrieval_count)
    return list
  }, [chunks.chunks, term, page, mode])

  const sizes = useMemo(() => {
    const bins = new Map<number, number>()
    chunks.chunks.forEach((c) => {
      const bin = Math.floor(c.char_count / 200) * 200
      bins.set(bin, (bins.get(bin) ?? 0) + 1)
    })
    return [...bins.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([bin, count]) => ({ range: `${bin}-${bin + 199}`, count }))
  }, [chunks.chunks])

  return (
    <>
      <Drawer
        open={Boolean(documentId)}
        onOpenChange={(open) => !open && onClose()}
        title={d?.filename ?? 'Document'}
        description={
          d
            ? `${d.page_count} pages · ${d.chunk_count} chunks · uploaded ${formatDateTime(d.created_at)}`
            : 'Loading document'
        }
        width="max-w-4xl"
        actions={
          d ? (
            <>
              {d.file_available ? (
                <a
                  href={documentsApi.fileUrl(d.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                  aria-label="Download original PDF"
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </a>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                loading={reindex.isPending}
                onClick={() => setConfirmReindex(true)}
              >
                <RefreshCcw className="size-3.5" />
                <span className="hidden sm:inline">Re-index</span>
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDoc(true)}>
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          ) : null
        }
      >
        {detail.isPending ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
            <Skeleton className="h-48" />
          </div>
        ) : detail.error ? (
          <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
        ) : d ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Info label="Document ID" value={d.id} mono />
              <Info label="Status" value={d.status} />
              <Info label="File size" value={formatBytes(d.file_size_bytes)} />
              <Info label="Characters" value={formatNumber(d.character_count)} />
              <Info label="Embedding" value={`${d.embedding_model} · ${d.embedding_dimension}d`} mono />
              <Info label="Chunking" value={`${d.chunk_size} / ${d.chunk_overlap} overlap`} />
              <Info label="Processing" value={formatDuration(d.processing_ms)} />
              <Info
                label="Retrievals"
                value={`${d.stats.total_retrievals} · avg ${d.stats.avg_similarity?.toFixed(3) ?? '-'}`}
              />
            </div>
            {d.title || d.author ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {d.title ? <Badge tone="outline">Title: {d.title}</Badge> : null}
                {d.author ? <Badge tone="outline">Author: {d.author}</Badge> : null}
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border-line rounded-2xl border p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <span>Chunk size distribution</span>
                  <span className="text-ink-muted font-mono font-medium">
                    {d.stats.min_chunk_chars}-{d.stats.max_chunk_chars} chars · avg{' '}
                    {Math.round(d.stats.avg_chunk_chars)}
                  </span>
                </div>
                {chunks.isPending ? (
                  <Skeleton className="h-40" />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={sizes}
                      margin={{ top: 6, right: 4, left: 0, bottom: 0 }}
                      barCategoryGap="10%"
                    >
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="range" {...axisProps} tick={{ ...axisProps.tick, fontSize: 9.5 }} />
                      <YAxis {...axisProps} width={28} allowDecimals={false} />
                      <Tooltip
                        cursor={cursorStyle}
                        content={<ChartTooltip labelFormatter={(l) => `${l} characters`} />}
                      />
                      <Bar
                        dataKey="count"
                        name="Chunks"
                        fill="var(--series-2)"
                        radius={[4, 4, 0, 0]}
                        {...anim}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="border-line rounded-2xl border p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <span>Page-by-chunk map</span>
                  {page != null ? (
                    <Button variant="ghost" size="xs" onClick={() => setPage(null)}>
                      <X className="size-3" /> Page {page}
                    </Button>
                  ) : (
                    <span className="text-ink-muted font-medium">click a page to filter</span>
                  )}
                </div>
                {chunks.isPending ? (
                  <Skeleton className="h-32" />
                ) : (
                  <div className="max-h-44 overflow-y-auto">
                    <ChunkMap
                      chunks={chunks.chunks}
                      onSelect={(p) => setPage(page === p ? null : p)}
                      selectedPage={page}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-bold">Chunks</h3>
                <Badge size="xs">
                  {filtered.length} of {chunks.total}
                </Badge>
                {chunks.hasNextPage || chunks.isFetchingNextPage ? (
                  <Badge size="xs" tone="info">
                    loading more
                  </Badge>
                ) : null}
                <SegmentedControl<Mode>
                  size="sm"
                  label="Chunk filter"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'top', label: 'Most retrieved' },
                    { value: 'retrieved', label: 'Retrieved' },
                    { value: 'never', label: 'Never retrieved' },
                  ]}
                  className="ml-auto"
                />
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Find text in chunks"
                  className="w-full sm:w-56"
                  pending={search !== term}
                />
              </div>
              {chunks.isPending ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                </div>
              ) : chunks.error ? (
                <ErrorState error={chunks.error} onRetry={() => chunks.refetch()} />
              ) : !filtered.length ? (
                <EmptyState
                  compact
                  icon={<FileText className="size-5" aria-hidden />}
                  title="No chunks match"
                  description="Clear the filters to see every chunk."
                />
              ) : (
                <VirtualChunkList chunks={filtered} term={term} onDelete={setChunkTarget} height={620} />
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
      <ConfirmDialog
        open={confirmDoc}
        onOpenChange={setConfirmDoc}
        title="Delete this document?"
        description={
          <>
            This removes <strong>{d?.filename}</strong>, its {d?.chunk_count} chunks and their vectors.
            Retrieval history stays in the logs.
          </>
        }
        confirmLabel="Delete document"
        confirmWord="DELETE"
        onConfirm={() => {
          if (d) deleteDoc.mutate(d.id, { onSuccess: onClose })
          setConfirmDoc(false)
        }}
      />
      <ConfirmDialog
        open={confirmReindex}
        onOpenChange={setConfirmReindex}
        title="Re-index this document?"
        description="All chunks of this document will be re-embedded and written back to the vector database. Retrieval for this document may be briefly unavailable."
        confirmLabel="Re-index"
        loading={reindex.isPending}
        onConfirm={async () => {
          if (d) await reindex.mutateAsync(d.id).catch(() => undefined)
          setConfirmReindex(false)
        }}
      />
      <ConfirmDialog
        open={Boolean(chunkTarget)}
        onOpenChange={(open) => !open && setChunkTarget(null)}
        title={`Delete chunk #${chunkTarget?.id}?`}
        description="The chunk text and its vector are removed from the index. The agent can no longer retrieve it."
        confirmLabel="Delete chunk"
        onConfirm={() => {
          if (chunkTarget) deleteChunk.mutate(chunkTarget.id)
          setChunkTarget(null)
        }}
      />
    </>
  )
}
