import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { fadeUp, stagger } from '@/lib/motion'
import type { TraceStep } from '../types'
import { parseDocumentHits } from '../parsers'
import { MonoBlock, ScoreBar } from './shared'

export const DocumentSearchRenderer = memo(function DocumentSearchRenderer({ step }: { step: TraceStep }) {
  const hits = useMemo(
    () => parseDocumentHits(step.output ?? '', step.metadata),
    [step.output, step.metadata],
  )
  const [open, setOpen] = useState<number | null>(null)
  if (!hits.length) return <MonoBlock>{step.output || 'No matching chunks'}</MonoBlock>
  return (
    <motion.ul variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-2">
      {hits.map((hit, index) => (
        <motion.li
          key={`${hit.chunkId}-${index}`}
          variants={fadeUp}
          className="border-line bg-surface-strong rounded-xl border p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-success/12 text-success grid size-6 place-items-center rounded-md">
              <FileText className="size-3.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{hit.documentName}</span>
            <Badge size="xs" tone="outline">
              p. {hit.page}
            </Badge>
            {hit.chunkId != null ? (
              <Badge size="xs" tone="neutral">
                chunk {hit.chunkId}
              </Badge>
            ) : null}
            {hit.lowRelevance ? (
              <Badge size="xs" tone="warning">
                low relevance
              </Badge>
            ) : null}
            <ScoreBar score={hit.score} />
          </div>
          {hit.text ? (
            <button
              type="button"
              onClick={() => setOpen(open === index ? null : index)}
              aria-expanded={open === index}
              className={cn(
                'text-ink-muted mt-2 w-full text-left text-xs leading-relaxed',
                open !== index && 'line-clamp-3',
              )}
            >
              {hit.text}
            </button>
          ) : null}
        </motion.li>
      ))}
    </motion.ul>
  )
})
