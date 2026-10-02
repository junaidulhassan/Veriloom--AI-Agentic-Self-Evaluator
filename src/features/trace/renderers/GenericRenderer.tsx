import { memo } from 'react'
import type { TraceStep } from '../types'
import { MonoBlock } from './shared'

export const GenericRenderer = memo(function GenericRenderer({ step }: { step: TraceStep }) {
  return <MonoBlock>{step.output || step.error || 'No output'}</MonoBlock>
})

export const ListDocumentsRenderer = memo(function ListDocumentsRenderer({ step }: { step: TraceStep }) {
  const lines = (step.output ?? '').split('\n').filter((line) => line.startsWith('- '))
  if (!lines.length) return <MonoBlock>{step.output || 'No documents'}</MonoBlock>
  return (
    <ul className="space-y-1">
      {lines.map((line) => {
        const match = /^- (.+?) \(id=([^,]+), pages=(\d+), chunks=(\d+)/.exec(line)
        return (
          <li
            key={line}
            className="bg-surface-strong flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs"
          >
            <span className="truncate font-semibold">{match?.[1] ?? line.slice(2)}</span>
            {match ? (
              <span className="text-ink-muted shrink-0 font-mono text-[11px]">
                {match[3]} pages · {match[4]} chunks
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
})
