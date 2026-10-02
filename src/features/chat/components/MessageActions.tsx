import { memo, useState } from 'react'
import { Check, Copy, RotateCcw, Waypoints } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { copyText } from '@/lib/utils'

export const MessageActions = memo(function MessageActions({
  text,
  onRegenerate,
  onTrace,
  disabled,
}: {
  text: string
  onRegenerate?: () => void
  onTrace?: () => void
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip content={copied ? 'Copied' : 'Copy answer'}>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Copy answer"
          onClick={async () => {
            try {
              await copyText(text)
              setCopied(true)
              setTimeout(() => setCopied(false), 1400)
            } catch {
              toast.error('Copy failed')
            }
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </Tooltip>
      {onRegenerate ? (
        <Tooltip content="Regenerate">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Regenerate answer"
            onClick={onRegenerate}
            disabled={disabled}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </Tooltip>
      ) : null}
      {onTrace ? (
        <Tooltip content="View agent trace">
          <Button variant="ghost" size="icon-xs" aria-label="View agent trace" onClick={onTrace}>
            <Waypoints className="size-3.5" />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  )
})
