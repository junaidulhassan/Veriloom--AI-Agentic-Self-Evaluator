import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Copy, MessageSquareText } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ErrorState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { useAgentTrace } from '@/features/chat/hooks/useAgentTrace'
import { useChatStore } from '@/features/chat/store'
import { TraceOverview } from '@/features/trace/components/TraceOverview'
import { TraceTimeline } from '@/features/trace/components/TraceTimeline'
import { shortId } from '@/lib/format'
import { copyText } from '@/lib/utils'

const TraceViewerContext = createContext<(requestId: string) => void>(() => undefined)

export function useTraceViewer() {
  return useContext(TraceViewerContext)
}

export function TraceDetail({ requestId }: { requestId: string }) {
  const trace = useAgentTrace(requestId)
  if (trace.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <SkeletonText lines={4} />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }
  if (trace.error) return <ErrorState error={trace.error} onRetry={() => trace.refetch()} />
  if (!trace.data || !trace.state) return null
  return (
    <div className="space-y-6">
      <TraceOverview trace={trace.data} />
      <div>
        <h3 className="font-display mb-3 text-sm font-bold">Execution timeline</h3>
        <TraceTimeline steps={trace.state.steps} maxAttempts={trace.state.maxAttempts} expandOutputs />
      </div>
      {trace.data.request.final_answer ? (
        <div>
          <h3 className="font-display mb-2 text-sm font-bold">Final answer</h3>
          <div className="bg-surface-strong/70 rounded-2xl p-4">
            <Markdown content={trace.data.request.final_answer} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function TraceViewerProvider({ children }: { children: ReactNode }) {
  const [requestId, setRequestId] = useState<string | null>(null)
  const navigate = useNavigate()
  const open = useCallback((id: string) => setRequestId(id), [])
  const trace = useAgentTrace(requestId)
  const conversationId = trace.data?.request.conversation_id
  return (
    <TraceViewerContext.Provider value={open}>
      {children}
      <Drawer
        open={Boolean(requestId)}
        onOpenChange={(value) => !value && setRequestId(null)}
        title="Execution trace"
        description={requestId ? `Request ${shortId(requestId, 12)}` : undefined}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!requestId) return
                void copyText(requestId).then(() => toast.success('Request ID copied'))
              }}
            >
              <Copy className="size-3.5" />
              ID
            </Button>
            {conversationId ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  useChatStore.getState().setActiveConversation(conversationId)
                  useChatStore.getState().selectRequest(requestId)
                  navigate('/veriloom/chat/ai-assistant')
                }}
              >
                <MessageSquareText className="size-3.5" />
                Open chat
              </Button>
            ) : null}
          </>
        }
      >
        {requestId ? <TraceDetail requestId={requestId} /> : null}
      </Drawer>
    </TraceViewerContext.Provider>
  )
}
