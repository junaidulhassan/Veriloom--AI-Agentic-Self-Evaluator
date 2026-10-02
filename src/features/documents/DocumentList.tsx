import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatRelative } from '@/lib/format'
import type { DocumentOut } from '@/types/api'
import { useDeleteDocument, useDocuments } from './useDocuments'

const DocumentRow = memo(function DocumentRow({
  doc,
  onDelete,
}: {
  doc: DocumentOut
  onDelete: (doc: DocumentOut) => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      className="group hover:bg-charcoal-900/[0.05] dark:hover:bg-cream/5 flex items-center gap-2.5 rounded-xl px-2 py-2"
    >
      <span className="bg-success/12 text-success grid size-8 shrink-0 place-items-center rounded-lg">
        <FileText className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold" title={doc.filename}>
          {doc.filename}
        </div>
        <div className="text-ink-muted text-[11px]">
          {doc.page_count} pages · {doc.chunk_count} chunks · {formatRelative(doc.created_at)}
        </div>
      </div>
      <Tooltip content="Delete document">
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Delete ${doc.filename}`}
          onClick={() => onDelete(doc)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </Tooltip>
    </motion.li>
  )
})

export function DocumentList() {
  const { data, isPending, error, refetch } = useDocuments()
  const remove = useDeleteDocument()
  const [target, setTarget] = useState<DocumentOut | null>(null)
  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-11" />
        ))}
      </div>
    )
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} compact />
  if (!data?.items.length) {
    return (
      <EmptyState
        compact
        icon={<FileText className="size-5" aria-hidden />}
        title="No documents yet"
        description="Upload PDFs so the agent can answer from them."
      />
    )
  }
  return (
    <>
      <ul className="space-y-0.5" aria-label="Uploaded documents">
        <AnimatePresence initial={false}>
          {data.items.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onDelete={setTarget} />
          ))}
        </AnimatePresence>
      </ul>
      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Delete document?"
        description={
          <>
            <strong>{target?.filename}</strong> and its {target?.chunk_count} chunks will be removed from the
            vector index. This cannot be undone.
          </>
        }
        confirmLabel="Delete document"
        loading={remove.isPending}
        onConfirm={() => {
          if (target) remove.mutate(target.id)
          setTarget(null)
        }}
      />
    </>
  )
}
