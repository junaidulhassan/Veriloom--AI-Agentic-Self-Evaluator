import { memo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Globe } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { hostname } from '@/lib/utils'
import { fadeUp, stagger } from '@/lib/motion'
import type { Source } from '@/types/api'

export const SourceChips = memo(function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null
  return (
    <div>
      <div className="text-ink-muted mb-1.5 text-[11px] font-bold tracking-wider uppercase">Sources</div>
      <motion.ul variants={stagger(0.04)} initial="hidden" animate="show" className="flex flex-wrap gap-1.5">
        {sources.slice(0, 12).map((source, index) => {
          const isWeb = source.type === 'web'
          const label = isWeb
            ? hostname(source.url)
            : `${source.title ?? 'Document'}${source.page != null ? ` · p.${source.page}` : ''}`
          const content = (
            <>
              <span
                className={
                  isWeb
                    ? 'bg-info/15 text-info grid size-4 place-items-center rounded'
                    : 'bg-success/15 text-success grid size-4 place-items-center rounded'
                }
              >
                {isWeb ? (
                  <Globe className="size-2.5" aria-hidden />
                ) : (
                  <FileText className="size-2.5" aria-hidden />
                )}
              </span>
              <span className="max-w-48 truncate">{label}</span>
              {source.score != null && !isWeb ? (
                <span className="text-ink-muted font-mono text-[10px]">{source.score.toFixed(2)}</span>
              ) : null}
            </>
          )
          const className =
            'inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface-strong px-2 text-[11.5px] font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink'
          return (
            <motion.li key={`${source.url ?? source.chunk_id}-${index}`} variants={fadeUp}>
              <Tooltip content={source.title ?? source.url ?? ''}>
                {isWeb && source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer noopener" className={className}>
                    {content}
                  </a>
                ) : (
                  <span className={className} tabIndex={0}>
                    {content}
                  </span>
                )}
              </Tooltip>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
})
