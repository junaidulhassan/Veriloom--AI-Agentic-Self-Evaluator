import { memo, useDeferredValue, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { isToday, isYesterday, subDays } from 'date-fns'
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatRelative, parseApiDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ConversationOut } from '@/types/api'
import { useConversations, useDeleteConversation, useRenameConversation } from '../hooks/useConversations'
import { useChatStore } from '../store'
import { RenameDialog } from './RenameDialog'

type Row = { type: 'header'; label: string } | { type: 'item'; conversation: ConversationOut }

function groupLabel(value: string) {
  const date = parseApiDate(value)
  if (!date) return 'Older'
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (date > subDays(new Date(), 7)) return 'Previous 7 days'
  if (date > subDays(new Date(), 30)) return 'Previous 30 days'
  return 'Older'
}

const SessionRow = memo(function SessionRow({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: ConversationOut
  active: boolean
  onSelect: (id: string) => void
  onRename: (conversation: ConversationOut) => void
  onDelete: (conversation: ConversationOut) => void
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-xl transition-colors',
        active
          ? 'bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900'
          : 'hover:bg-charcoal-900/[0.06] dark:hover:bg-cream/5',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={active ? 'true' : undefined}
        className="min-w-0 flex-1 px-3 py-2 text-left"
      >
        <div className="truncate text-[13px] font-semibold">
          {conversation.title || 'Untitled conversation'}
        </div>
        <div
          className={cn('text-[11px]', active ? 'text-cream/70 dark:text-charcoal-900/70' : 'text-ink-muted')}
        >
          {conversation.message_count} messages · {formatRelative(conversation.updated_at)}
        </div>
      </button>
      <DropdownMenu
        trigger={
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              'mr-1 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              active && 'text-cream hover:bg-cream/10 dark:text-charcoal-900 opacity-100',
            )}
            aria-label={`Actions for ${conversation.title}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
        items={[
          { label: 'Rename', icon: <Pencil className="size-3.5" />, onSelect: () => onRename(conversation) },
          {
            label: 'Delete',
            icon: <Trash2 className="size-3.5" />,
            onSelect: () => onDelete(conversation),
            destructive: true,
          },
        ]}
      />
    </div>
  )
})

export function SessionList({ onNavigate }: { onNavigate?: () => void }) {
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const deferred = useDeferredValue(search)
  const { data, isPending, error, refetch, isFetching } = useConversations(debounced)
  const activeId = useChatStore((s) => s.activeConversationId)
  const setActive = useChatStore((s) => s.setActiveConversation)
  const rename = useRenameConversation()
  const remove = useDeleteConversation()
  const [renaming, setRenaming] = useState<ConversationOut | null>(null)
  const [deleting, setDeleting] = useState<ConversationOut | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const rows = useMemo<Row[]>(() => {
    const needle = deferred.trim().toLowerCase()
    const items = (data?.items ?? []).filter((item) => !needle || item.title.toLowerCase().includes(needle))
    const result: Row[] = []
    let current = ''
    for (const conversation of items) {
      const label = groupLabel(conversation.updated_at)
      if (label !== current) {
        current = label
        result.push({ type: 'header', label })
      }
      result.push({ type: 'item', conversation })
    }
    return result
  }, [data, deferred])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index]?.type === 'header' ? 30 : 54),
    overscan: 8,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search conversations"
        pending={isFetching && search !== ''}
      />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isPending ? (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} compact />
        ) : !rows.length ? (
          <EmptyState
            compact
            icon={<MessageSquare className="size-5" aria-hidden />}
            title={search ? 'No matches' : 'No conversations yet'}
            description={search ? 'Try another search term.' : 'Your chats will appear here.'}
          />
        ) : (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index]
              return (
                <div
                  key={item.key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full py-0.5"
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  {row.type === 'header' ? (
                    <div className="text-ink-muted px-3 pt-3 pb-1 text-[10.5px] font-bold tracking-wider uppercase">
                      {row.label}
                    </div>
                  ) : (
                    <SessionRow
                      conversation={row.conversation}
                      active={row.conversation.id === activeId}
                      onSelect={(id) => {
                        setActive(id)
                        onNavigate?.()
                      }}
                      onRename={setRenaming}
                      onDelete={setDeleting}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <RenameDialog
        open={Boolean(renaming)}
        onOpenChange={(open) => !open && setRenaming(null)}
        initial={renaming?.title ?? ''}
        onSubmit={(title) => renaming && rename.mutate({ id: renaming.id, title })}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete conversation?"
        description={
          <>
            <strong>{deleting?.title}</strong> and its messages will be permanently removed. Evaluation logs
            are kept for the dashboard.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate({ id: deleting.id })
          setDeleting(null)
        }}
      />
    </div>
  )
}
