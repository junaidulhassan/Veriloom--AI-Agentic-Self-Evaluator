import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Globe, Sparkles } from 'lucide-react'
import { hostname } from '@/lib/utils'
import { stagger, fadeUp } from '@/lib/motion'
import type { TraceStep } from '../types'
import { parseWebResults } from '../parsers'
import { MonoBlock, ScoreBar } from './shared'

export const WebSearchRenderer = memo(function WebSearchRenderer({ step }: { step: TraceStep }) {
  const { summary, results } = useMemo(
    () => parseWebResults(step.output ?? '', step.metadata),
    [step.output, step.metadata],
  )
  if (!results.length) return <MonoBlock>{step.output || 'No results'}</MonoBlock>
  return (
    <div className="space-y-2">
      {summary ? (
        <div className="bg-info/10 text-ink-soft flex gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed">
          <Sparkles className="text-info mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{summary}</span>
        </div>
      ) : null}
      <motion.ul
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="grid gap-2 sm:grid-cols-2"
      >
        {results.map((result, index) => (
          <motion.li key={`${result.url}-${index}`} variants={fadeUp}>
            <a
              href={result.url || undefined}
              target="_blank"
              rel="noreferrer noopener"
              className="group border-line bg-surface-strong flex h-full flex-col gap-1.5 rounded-xl border p-3 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <span className="text-ink-muted flex items-center gap-1.5 text-[11px]">
                <span className="bg-info/12 text-info grid size-5 place-items-center rounded-md">
                  <Globe className="size-3" aria-hidden />
                </span>
                <span className="truncate">{hostname(result.url)}</span>
                <ExternalLink
                  className="ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </span>
              <span className="text-ink line-clamp-2 text-[13px] leading-snug font-semibold">
                {result.title}
              </span>
              {result.snippet ? (
                <span className="text-ink-muted line-clamp-3 text-xs leading-relaxed">{result.snippet}</span>
              ) : null}
              <span className="mt-auto pt-1">
                <ScoreBar score={result.score} label="Relevance" />
              </span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
})
