import { Info } from 'lucide-react'
import { Tooltip } from './Tooltip'

export function InfoTip({ content, label = 'More information' }: { content: string; label?: string }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label={label}
        className="text-ink-muted hover:bg-charcoal-900/[0.07] hover:text-ink grid size-6 place-items-center rounded-full transition-colors"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
    </Tooltip>
  )
}
