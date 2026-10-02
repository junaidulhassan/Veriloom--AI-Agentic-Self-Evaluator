import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Paperclip, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { UploadQueue } from '@/features/documents/UploadZone'
import { useUploadDocuments } from '@/features/documents/useDocuments'
import { useOnline } from '@/hooks/useOnline'
import { cn } from '@/lib/utils'
import { snappy } from '@/lib/motion'
import { useChatStore } from '../store'

const MAX = 20000

export const Composer = memo(function Composer({
  busy,
  onSend,
  onStop,
  showUploads = true,
}: {
  showUploads?: boolean
  busy: boolean
  onSend: (text: string) => Promise<boolean>
  onStop: () => void
}) {
  const value = useChatStore((s) => s.draft)
  const setValue = useChatStore((s) => s.setDraft)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadDocuments()
  const online = useOnline()
  const [composing, setComposing] = useState(false)
  const length = value.length
  const canSend = Boolean(value.trim()) && !busy && online && length <= MAX

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, 220)}px`
  }, [value])

  useEffect(() => {
    if (!busy) ref.current?.focus()
  }, [busy])

  const submit = async () => {
    if (!canSend) return
    const text = value
    setValue('')
    await onSend(text)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !composing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className="px-3 pb-3 sm:px-6 sm:pb-5">
      <div className="mx-auto w-full max-w-3xl space-y-2">
        {showUploads ? <UploadQueue /> : null}
        <motion.form
          layout
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="glass-strong rounded-[26px] p-2 focus-within:shadow-[var(--shadow-glow)]"
        >
          <label htmlFor="composer" className="sr-only">
            Message Veriloom
          </label>
          <textarea
            id="composer"
            ref={ref}
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            placeholder={busy ? 'Veriloom is working...' : 'Ask anything. Shift + Enter for a new line'}
            className="text-ink placeholder:text-ink-muted block max-h-[220px] min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed outline-none"
            maxLength={MAX + 1000}
            aria-describedby="composer-help"
          />
          <div className="flex items-center gap-2 px-1">
            <Tooltip content="Attach PDF for document Q&A">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Attach PDF"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="size-4" />
              </Button>
            </Tooltip>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              hidden
              onChange={(event) => {
                void upload(Array.from(event.target.files ?? []))
                event.target.value = ''
              }}
            />
            <span id="composer-help" className="text-ink-muted hidden text-[11px] sm:inline">
              Enter to send · Shift + Enter for new line
            </span>
            <span
              className={cn(
                'ml-auto font-mono text-[11px] tabular-nums',
                length > MAX
                  ? 'text-error'
                  : length > MAX * 0.9
                    ? 'dark:text-warning text-[#8a5a0c]'
                    : 'text-ink-muted',
              )}
            >
              {length.toLocaleString('en')}/{MAX.toLocaleString('en')}
            </span>
            {busy ? (
              <Button type="button" size="icon" onClick={onStop} aria-label="Stop generating">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key="stop"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={snappy}
                  >
                    <Square className="size-3.5 fill-current" />
                  </motion.span>
                </AnimatePresence>
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!canSend} aria-label="Send message">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key="send"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={snappy}
                  >
                    <ArrowUp className="size-4" />
                  </motion.span>
                </AnimatePresence>
              </Button>
            )}
          </div>
        </motion.form>
        {!online ? (
          <p className="text-on-page text-center text-[11px] font-semibold">
            Offline: sending is paused until you reconnect.
          </p>
        ) : null}
      </div>
    </div>
  )
})
