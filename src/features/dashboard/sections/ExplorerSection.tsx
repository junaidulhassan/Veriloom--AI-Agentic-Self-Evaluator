import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Cpu,
  DatabaseZap,
  FileText,
  Layers,
  RefreshCcw,
  Search,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { UploadZone } from '@/features/documents/UploadZone'
import { useDocuments } from '@/features/documents/useDocuments'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatBytes, formatNumber, formatRelative, shortId, truncate } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import { Section } from '../components/Section'
import { useRagDocuments } from '../hooks'
import { DocumentDrawer } from '../explorer/DocumentDrawer'
import { VirtualChunkList } from '../explorer/VirtualChunkList'
import { useChunkSearch, useIndexStatus, useReindex } from '../explorer/useExplorer'

function IndexBar() {
  const status = useIndexStatus()
  const reindex = useReindex()
  const [confirm, setConfirm] = useState(false)
  const s = status.data
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-10 place-items-center rounded-2xl">
        <DatabaseZap className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="font-display text-[15px] font-bold">Vector Database</div>
        {status.isPending ? (
          <Skeleton className="mt-1 h-3 w-48" />
        ) : s ? (
          <div className="text-ink-muted mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-mono">{formatNumber(s.vectors)} vectors</span>·
            <span>{s.documents} docs</span>·<span>{s.database_chunks} chunks in DB</span>
          </div>
        ) : (
          <span className="text-error text-xs">Index status unavailable</span>
        )}
      </div>
      {s ? (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            tone={s.in_sync ? 'success' : 'warning'}
            icon={s.in_sync ? <CheckCircle2 className="size-3" /> : <TriangleAlert className="size-3" />}
          >
            {s.in_sync ? 'In sync' : 'Out of sync'}
          </Badge>
          {s.stale ? <Badge tone="warning">Stale</Badge> : null}
          <Badge tone={s.embedding_model_loaded ? 'success' : 'warning'} icon={<Cpu className="size-3" />}>
            {s.embedding_model_loaded ? 'Embedder ready' : 'Embedder not loaded'}
          </Badge>
        </div>
      ) : null}
      <Button className="ml-auto" loading={reindex.isPending} onClick={() => setConfirm(true)}>
        <RefreshCcw className="size-4" />
        {reindex.isPending ? 'Rebuilding index' : 'Rebuild index'}
      </Button>
      {reindex.isPending ? (
        <div
          className="bg-charcoal-900/10 dark:bg-cream/10 relative h-1 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Rebuilding vector index"
        >
          <motion.div
            className="bg-charcoal-900 dark:bg-coral-400 absolute inset-y-0 w-1/3 rounded-full"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      ) : null}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Rebuild the whole vector index?"
        description="Every chunk of every document is re-embedded and the vector database is rebuilt from scratch. Document search may be unavailable until it finishes."
        confirmLabel="Rebuild index"
        confirmWord="REINDEX"
        loading={reindex.isPending}
        onConfirm={async () => {
          setConfirm(false)
          await reindex.mutateAsync(undefined).catch(() => undefined)
          void status.refetch()
        }}
      />
    </Card>
  )
}

function ChunkSearch({ documents }: { documents: { value: string; label: string }[] }) {
  const [query, setQuery] = useState('')
  const [docFilter, setDocFilter] = useState('all')
  const debounced = useDebouncedValue(query, 350)
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState('')
  useEffect(() => startTransition(() => setTerm(debounced)), [debounced])
  const search = useChunkSearch(term, docFilter === 'all' ? undefined : docFilter)
  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        title="Search chunks"
        icon={<Search className="size-4" />}
        description="Keyword search across every chunk, with matches highlighted."
        className="mb-3"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search chunk text, e.g. revenue, methodology"
          className="min-w-60 flex-1"
          pending={search.isFetching || isPending || query !== debounced}
        />
        <Select
          label="Document filter"
          value={docFilter}
          onValueChange={setDocFilter}
          options={[{ value: 'all', label: 'All documents' }, ...documents]}
          className="w-56"
        />
      </div>
      {term.trim().length < 2 ? (
        <EmptyState
          compact
          icon={<Search className="size-5" aria-hidden />}
          title="Type at least two characters"
          description="Results show the full chunk text with your search terms highlighted."
        />
      ) : search.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : search.error ? (
        <ErrorState error={search.error} onRetry={() => search.refetch()} compact />
      ) : !search.data?.items.length ? (
        <EmptyState compact title="No matching chunks" description={`Nothing contains "${term}".`} />
      ) : (
        <>
          <p className="text-ink-muted mb-2 text-xs">
            {search.data.total} matching chunks
            {search.data.total > search.data.items.length
              ? `, showing the first ${search.data.items.length}`
              : ''}
          </p>
          <VirtualChunkList chunks={search.data.items} term={term} showDocument height={520} />
        </>
      )}
    </Card>
  )
}

export default function ExplorerSection() {
  const docs = useDocuments()
  const stats = useRagDocuments()
  const [params, setParams] = useSearchParams()
  const selected = params.get('doc')
  const retrievals = useMemo(
    () => new Map((stats.data ?? []).map((row) => [row.document_id, row])),
    [stats.data],
  )
  const items = useMemo(() => docs.data?.items ?? [], [docs.data])
  const options = useMemo(() => items.map((d) => ({ value: d.id, label: truncate(d.filename, 32) })), [items])
  const maxRetrieval = Math.max(1, ...[...retrievals.values()].map((r) => r.retrieval_hits))

  const open = (id: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (id) next.set('doc', id)
        else next.delete('doc')
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  return (
    <Section
      id="explorer"
      description="Inspect every uploaded document down to the exact chunk text the agent retrieves, and which questions pulled each chunk."
    >
      <IndexBar />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="xl:col-span-3">
          {docs.isPending ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-[var(--radius-card)]" />
              ))}
            </div>
          ) : docs.error ? (
            <Card>
              <ErrorState error={docs.error} onRetry={() => docs.refetch()} />
            </Card>
          ) : !items.length ? (
            <Card>
              <EmptyState
                icon={<FileText className="size-6" aria-hidden />}
                title="No documents indexed"
                description="Upload a PDF to start exploring its chunks, embeddings and retrievals."
              />
            </Card>
          ) : (
            <motion.ul
              variants={stagger(0.04)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {items.map((doc) => {
                const row = retrievals.get(doc.id)
                const hits = row?.retrieval_hits ?? 0
                return (
                  <motion.li key={doc.id} variants={fadeUp} layout>
                    <button
                      type="button"
                      onClick={() => open(doc.id)}
                      className="glass group flex h-full w-full flex-col gap-3 rounded-[var(--radius-card)] p-4 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105">
                          <FileText className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <div className="font-display line-clamp-2 text-[14px] leading-snug font-bold">
                            {doc.filename}
                          </div>
                          <div className="text-ink-muted mt-0.5 font-mono text-[10.5px]">
                            {shortId(doc.id, 12)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'pages', value: doc.page_count },
                          { label: 'chunks', value: doc.chunk_count },
                          { label: 'retrievals', value: hits },
                        ].map((m) => (
                          <div key={m.label} className="bg-surface-strong rounded-xl py-1.5">
                            <div className="font-sans text-base font-extrabold tabular-nums">
                              {formatNumber(m.value)}
                            </div>
                            <div className="text-ink-muted text-[10px] font-semibold tracking-wider uppercase">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        className="bg-charcoal-900/10 dark:bg-cream/10 h-1.5 overflow-hidden rounded-full"
                        aria-hidden
                      >
                        <motion.div
                          className="h-full rounded-full bg-[var(--series-3)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(hits / maxRetrieval) * 100}%` }}
                          transition={{ duration: 0.9 }}
                        />
                      </div>
                      <div className="text-ink-muted mt-auto flex flex-wrap items-center gap-1.5 text-[11px]">
                        <Badge size="xs" tone={doc.status === 'ready' ? 'success' : 'warning'}>
                          {doc.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="size-3" aria-hidden />
                          {doc.embedding_model.split('/').pop()} · {doc.embedding_dimension}d
                        </span>
                        <span>· {formatBytes(doc.file_size_bytes)}</span>
                        <span>· {formatRelative(doc.created_at)}</span>
                      </div>
                    </button>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </div>
        <Card className="p-4">
          <CardHeader
            title="Add documents"
            description="New PDFs are chunked, embedded and indexed immediately."
            className="mb-3"
          />
          <UploadZone />
        </Card>
      </div>
      <ChunkSearch documents={options} />
      <DocumentDrawer documentId={selected} onClose={() => open(null)} />
    </Section>
  )
}
