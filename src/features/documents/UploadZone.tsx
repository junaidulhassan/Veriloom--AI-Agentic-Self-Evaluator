import { memo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, FileUp, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import { useUploadDocuments, useUploadStore, MAX_UPLOAD_MB, type UploadItem } from './useDocuments'

const phaseLabel: Record<UploadItem['phase'], string> = {
  uploading: 'Uploading',
  extracting: 'Extracting text',
  chunking: 'Chunking',
  embedding: 'Embedding',
  indexed: 'Indexed',
  error: 'Failed',
}
const phaseOrder: UploadItem['phase'][] = ['uploading', 'extracting', 'chunking', 'embedding', 'indexed']

const UploadRow = memo(function UploadRow({ item }: { item: UploadItem }) {
  const dismiss = useUploadStore((s) => s.dismiss)
  const index = phaseOrder.indexOf(item.phase)
  const pct =
    item.phase === 'uploading'
      ? item.progress * 0.4
      : item.phase === 'indexed'
        ? 100
        : 40 + Math.max(0, index) * 15
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="border-line bg-surface-strong rounded-xl border px-3 py-2"
    >
      <div className="flex items-center gap-2 text-xs">
        {item.phase === 'error' ? (
          <AlertCircle className="text-error size-3.5 shrink-0" aria-hidden />
        ) : item.phase === 'indexed' ? (
          <CheckCircle2 className="text-success size-3.5 shrink-0" aria-hidden />
        ) : (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
        <span className="text-ink-muted shrink-0">{phaseLabel[item.phase]}</span>
        {item.phase === 'error' || item.phase === 'indexed' ? (
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label={`Dismiss ${item.name}`}
            className="text-ink-muted hover:bg-charcoal-900/10 grid size-5 place-items-center rounded-full"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>
      {item.phase === 'error' ? (
        <p className="text-error mt-1 text-[11px] leading-snug dark:text-[#ffb3ad]">{item.error}</p>
      ) : (
        <>
          <div
            className="bg-charcoal-900/10 dark:bg-cream/10 mt-1.5 h-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${item.name} progress`}
          >
            <motion.div
              className={cn(
                'h-full rounded-full',
                item.phase === 'indexed' ? 'bg-success' : 'bg-charcoal-900 dark:bg-coral-400',
              )}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="text-ink-muted mt-1 flex justify-between text-[10.5px]">
            <span>{formatBytes(item.size)}</span>
            {item.chunks != null ? (
              <span>{item.chunks} chunks</span>
            ) : (
              <span>{item.phase === 'uploading' ? `${item.progress}%` : 'processing'}</span>
            )}
          </div>
        </>
      )}
    </motion.li>
  )
})

export function UploadQueue() {
  const items = useUploadStore((s) => s.items)
  if (!items.length) return null
  return (
    <ul className="space-y-1.5" aria-label="Uploads">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <UploadRow key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </ul>
  )
}

export function UploadZone({ compact }: { compact?: boolean }) {
  const upload = useUploadDocuments()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const busy = useUploadStore((s) =>
    s.items.some((item) => item.phase !== 'indexed' && item.phase !== 'error'),
  )
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void upload(Array.from(event.dataTransfer.files))
        }}
        aria-label="Upload PDF documents"
        className={cn(
          'dash-border flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-3 text-center transition-colors',
          compact ? 'py-4' : 'py-6',
          dragging
            ? 'dash-border-active bg-coral-100/70 dark:bg-coral-500/10'
            : 'bg-surface-strong/50 hover:bg-surface-strong',
          busy && 'dash-border-active',
        )}
      >
        <motion.span
          animate={dragging ? { y: -3, scale: 1.08 } : { y: 0, scale: 1 }}
          className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-9 place-items-center rounded-xl"
        >
          <FileUp className="size-4" aria-hidden />
        </motion.span>
        <span className="text-xs font-bold">
          {dragging ? 'Drop to upload' : 'Drop PDFs or click to browse'}
        </span>
        <span className="text-ink-muted text-[11px]">Up to {MAX_UPLOAD_MB} MB each · indexed for RAG</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          void upload(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <UploadQueue />
    </div>
  )
}
