import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageSquareText, Waypoints } from 'lucide-react'
import { chatApi } from '@/api/chat'
import { qk } from '@/api/keys'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer'
import { ErrorState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime, formatDuration, formatNumber, shortId, truncate } from '@/lib/format'
import { dashboardApi } from '@/api/dashboard'
import type { RecentConversation } from '@/types/api'
import { useRecentConversations } from '../hooks'
import { useDashboardFilters } from '../useDashboardFilters'
import { useTraceViewer } from './TraceViewerContext'

function ConversationDetail({ id }: { id: string }) {
  const conversation = useQuery({ queryKey: qk.conversation(id), queryFn: () => chatApi.conversation(id) })
  const requests = useQuery({
    queryKey: ['dashboard', 'conversation-requests', id],
    queryFn: () => dashboardApi.requests({ conversation_id: id, page_size: 200 }),
  })
  const openTrace = useTraceViewer()
  const byRequest = useMemo(
    () => new Map((requests.data?.items ?? []).map((r) => [r.id, r])),
    [requests.data],
  )
  if (conversation.isPending)
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  if (conversation.error)
    return <ErrorState error={conversation.error} onRetry={() => conversation.refetch()} />
  const totalTokens = (requests.data?.items ?? []).reduce((s, r) => s + r.total_tokens, 0)
  return (
    <div className="space-y-4">
      <div className="text-ink-muted flex flex-wrap gap-2 text-xs">
        <span>{conversation.data.message_count} messages</span>·
        <span>{requests.data?.total ?? 0} requests</span>·<span>{formatNumber(totalTokens)} tokens</span>·
        <span>started {formatDateTime(conversation.data.created_at)}</span>
      </div>
      <ol className="space-y-3">
        {conversation.data.messages.map((message) => {
          const request = message.request_id ? byRequest.get(message.request_id) : undefined
          const user = message.role === 'user'
          return (
            <li key={message.id} className={user ? 'flex justify-end' : ''}>
              <div
                className={
                  user
                    ? 'bg-charcoal-900 text-cream dark:bg-charcoal-700 max-w-[85%] rounded-3xl rounded-br-lg px-4 py-2.5 text-sm'
                    : 'border-line bg-surface-strong rounded-3xl rounded-tl-lg border p-4'
                }
              >
                {user ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <Markdown content={message.content} className="text-[13.5px]" />
                )}
                {!user && message.request_id ? (
                  <div className="border-line text-ink-muted mt-3 flex flex-wrap items-center gap-2 border-t pt-2 text-[11px]">
                    {request ? (
                      <>
                        <StatusBadge status={request.status} />
                        <span>{formatDuration(request.latency_ms)}</span>
                        <span>{formatNumber(request.total_tokens)} tokens</span>
                        <span>{request.tool_call_count} tools</span>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="ml-auto"
                      onClick={() => openTrace(message.request_id as string)}
                    >
                      <Waypoints className="size-3" /> Trace
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function ConversationsPanel() {
  const recent = useRecentConversations(200)
  const { filters } = useDashboardFilters()
  const [selected, setSelected] = useState<RecentConversation | null>(null)
  const data = useMemo(
    () => (recent.data ?? []).filter((c) => !filters.session || c.id === filters.session),
    [recent.data, filters.session],
  )
  const columns = useMemo<ColumnDef<RecentConversation, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Session',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="line-clamp-1 font-semibold">{row.original.title}</div>
            <div className="text-ink-muted font-mono text-[10.5px]">{shortId(row.original.id, 12)}</div>
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Started',
        cell: ({ getValue }) => <span className="text-ink-muted">{formatDateTime(String(getValue()))}</span>,
      },
      { accessorKey: 'request_count', header: 'Questions' },
      { accessorKey: 'message_count', header: 'Messages' },
      {
        accessorKey: 'last_question',
        header: 'Last question',
        cell: ({ getValue }) => (
          <span className="text-ink-muted line-clamp-1 max-w-xs">
            {truncate(String(getValue() ?? ''), 60)}
          </span>
        ),
      },
      {
        accessorKey: 'last_status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={(getValue() as string) ?? 'unknown'} />,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ getValue }) => <span className="text-ink-muted">{formatDateTime(String(getValue()))}</span>,
      },
    ],
    [],
  )
  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        loading={recent.isPending}
        error={recent.error}
        onRetry={() => recent.refetch()}
        onRowClick={setSelected}
        exportName="conversations"
        emptyTitle="No conversations yet"
        emptyIcon={<MessageSquareText className="size-5" />}
      />
      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.title ?? 'Conversation'}
        description={selected ? `Session ${shortId(selected.id, 12)}` : undefined}
      >
        {selected ? <ConversationDetail id={selected.id} /> : null}
      </Drawer>
    </>
  )
}
