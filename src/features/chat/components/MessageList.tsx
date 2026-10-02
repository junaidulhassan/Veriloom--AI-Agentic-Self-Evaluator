import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { MessageOut } from '@/types/api'
import type { LiveTurn } from '../store'
import { LiveAssistantMessage, StoredAssistantMessage, UserMessage } from './Messages'

type Item =
  | { kind: 'user'; key: string; content: string; createdAt: string | number }
  | { kind: 'stored'; key: string; content: string; requestId: string | null; question?: string }
  | { kind: 'live'; key: string; turn: LiveTurn }

export function buildItems(messages: MessageOut[], turns: LiveTurn[]): Item[] {
  const liveRequestIds = new Set(turns.map((turn) => turn.requestId).filter(Boolean))
  const items: Item[] = []
  let lastQuestion: string | undefined
  for (const message of messages) {
    if (message.request_id && liveRequestIds.has(message.request_id)) continue
    if (message.role === 'user') {
      lastQuestion = message.content
      items.push({ kind: 'user', key: message.id, content: message.content, createdAt: message.created_at })
    } else {
      items.push({
        kind: 'stored',
        key: message.id,
        content: message.content,
        requestId: message.request_id,
        question: lastQuestion,
      })
    }
  }
  for (const turn of turns) {
    items.push({ kind: 'user', key: `${turn.key}-q`, content: turn.question, createdAt: turn.createdAt })
    items.push({ kind: 'live', key: turn.key, turn })
  }
  return items
}

export function MessageList({
  messages,
  turns,
  loading,
  busy,
  onRegenerate,
}: {
  messages: MessageOut[]
  turns: LiveTurn[]
  loading: boolean
  busy: boolean
  onRegenerate: (question: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const [atBottom, setAtBottom] = useState(true)
  const items = useMemo(() => buildItems(messages, turns), [messages, turns])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (items[index]?.kind === 'user' ? 72 : 260),
    overscan: 6,
    getItemKey: (index) => items[index]?.key ?? index,
  })

  const scrollToBottom = useCallback((smooth = false) => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const totalSize = virtualizer.getTotalSize()
  useLayoutEffect(() => {
    if (stick.current) scrollToBottom()
  }, [totalSize, items.length, scrollToBottom])

  const lastLive = turns.at(-1)
  useEffect(() => {
    if (lastLive && (lastLive.status === 'sending' || lastLive.status === 'streaming')) {
      stick.current = true
      setAtBottom(true)
    }
  }, [lastLive?.key, lastLive?.status, lastLive])

  const onScroll = () => {
    const node = scrollRef.current
    if (!node) return
    const bottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120
    stick.current = bottom
    if (bottom !== atBottom) setAtBottom(bottom)
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain px-3 sm:px-6"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
      >
        <div className="mx-auto w-full max-w-3xl pt-14 pb-6">
          {loading ? (
            <div className="space-y-5" role="status" aria-label="Loading messages">
              <Skeleton className="ml-auto h-12 w-2/5 rounded-3xl" />
              <Skeleton className="h-44 w-4/5 rounded-3xl" />
              <Skeleton className="ml-auto h-12 w-1/3 rounded-3xl" />
              <Skeleton className="h-32 w-3/4 rounded-3xl" />
            </div>
          ) : (
            <div className="relative w-full" style={{ height: totalSize }}>
              {virtualizer.getVirtualItems().map((row) => {
                const item = items[row.index]
                if (!item) return null
                return (
                  <div
                    key={row.key}
                    data-index={row.index}
                    ref={virtualizer.measureElement}
                    className="absolute top-0 left-0 w-full pb-5"
                    style={{ transform: `translateY(${row.start}px)` }}
                  >
                    {item.kind === 'user' ? (
                      <UserMessage content={item.content} createdAt={item.createdAt} />
                    ) : item.kind === 'live' ? (
                      <LiveAssistantMessage turn={item.turn} onRegenerate={onRegenerate} />
                    ) : (
                      <StoredAssistantMessage
                        content={item.content}
                        requestId={item.requestId}
                        question={item.question}
                        busy={busy}
                        onRegenerate={onRegenerate}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {!atBottom ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
          >
            <Button
              size="sm"
              onClick={() => {
                stick.current = true
                setAtBottom(true)
                scrollToBottom(true)
              }}
              aria-label="Scroll to latest message"
            >
              <ArrowDown className="size-3.5" />
              Latest
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
