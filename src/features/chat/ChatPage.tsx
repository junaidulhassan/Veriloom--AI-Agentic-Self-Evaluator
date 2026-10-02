import { useCallback, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { spring } from '@/lib/motion'
import { useUiStore } from '@/store/ui'
import { describeError, toApiError } from '@/api/errors'
import { ErrorState } from '@/components/ui/EmptyState'
import { ChatHeader } from './components/ChatHeader'
import { ChatWelcome } from './components/ChatWelcome'
import { Composer } from './components/Composer'
import { MessageList } from './components/MessageList'
import { Sidebar } from './components/Sidebar'
import { TraceInspector } from './components/TraceInspector'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversations'
import { useChatStore } from './store'
import { toast } from 'sonner'

export default function ChatPage() {
  const activeId = useChatStore((s) => s.activeConversationId)
  const allTurns = useChatStore((s) => s.turns)
  const selectedRequestId = useChatStore((s) => s.selectedRequestId)
  const newChat = useChatStore((s) => s.newChat)
  const { sidebarOpen, setSidebarOpen, inspectorOpen, setInspectorOpen } = useUiStore()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const wide = useMediaQuery('(min-width: 1280px)')
  const conversation = useConversation(activeId)
  const { send, stop, busy } = useChat()

  const turns = useMemo(
    () =>
      allTurns.filter((turn) =>
        activeId
          ? turn.conversationId === activeId
          : turn.conversationId === null && turn.status === 'sending',
      ),
    [allTurns, activeId],
  )
  const messages = conversation.data?.messages ?? []
  const empty = !messages.length && !turns.length && !(activeId && conversation.isPending)

  useDocumentTitle('AI Assistant')

  useEffect(() => {
    if (conversation.error && toApiError(conversation.error).isNotFound) {
      toast.message('That conversation no longer exists. Starting a new chat.')
      newChat()
    }
  }, [conversation.error, newChat])

  useEffect(() => {
    if (!desktop) setSidebarOpen(false)
    if (!wide) setInspectorOpen(false)
  }, [desktop, wide, setSidebarOpen, setInspectorOpen])

  useEffect(() => {
    if (selectedRequestId) setInspectorOpen(true)
  }, [selectedRequestId, setInspectorOpen])

  const regenerate = useCallback(
    (question: string) => {
      if (busy) {
        toast.message('Wait for the current answer to finish')
        return
      }
      void send(question)
    },
    [busy, send],
  )

  const sidebarVisible = sidebarOpen
  const inspectorVisible = inspectorOpen

  return (
    <div className="flex h-[calc(100dvh-80px)] gap-3 px-3 pb-3 sm:px-4">
      <AnimatePresence initial={false}>
        {sidebarVisible ? (
          desktop ? (
            <motion.aside
              key="sidebar"
              aria-label="Conversations and documents"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={spring}
              className="glass shrink-0 overflow-hidden rounded-[var(--radius-panel)]"
            >
              <div className="h-full w-[300px]">
                <Sidebar />
              </div>
            </motion.aside>
          ) : (
            <motion.div
              key="sidebar-mobile"
              className="fixed inset-0 z-50 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="bg-charcoal-900/40 absolute inset-0 backdrop-blur-[2px]"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
              <motion.aside
                aria-label="Conversations and documents"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={spring}
                className="glass-strong relative h-full w-[86vw] max-w-[320px] rounded-r-[var(--radius-panel)]"
              >
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
              </motion.aside>
            </motion.div>
          )
        ) : null}
      </AnimatePresence>

      <motion.section
        layout
        transition={spring}
        className="relative flex min-w-0 flex-1 flex-col"
        aria-label="Chat"
      >
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
          inspectorOpen={inspectorOpen}
        />
        {conversation.error && !toApiError(conversation.error).isNotFound ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="glass rounded-[var(--radius-card)] px-6">
              <ErrorState error={conversation.error} onRetry={() => conversation.refetch()} />
              <p className="sr-only">{describeError(conversation.error)}</p>
            </div>
          </div>
        ) : empty ? (
          <ChatWelcome onPick={(prompt) => void send(prompt)} />
        ) : (
          <MessageList
            messages={messages}
            turns={turns}
            loading={Boolean(activeId) && conversation.isPending && !turns.length}
            busy={busy}
            onRegenerate={regenerate}
          />
        )}
        <Composer busy={busy} onSend={send} onStop={stop} showUploads={!(sidebarOpen && desktop)} />
      </motion.section>

      <AnimatePresence initial={false}>
        {inspectorVisible ? (
          wide ? (
            <motion.aside
              key="inspector"
              aria-label="Agent trace inspector"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={spring}
              className="glass shrink-0 overflow-hidden rounded-[var(--radius-panel)]"
            >
              <div className="h-full w-[440px]">
                <TraceInspector onClose={() => setInspectorOpen(false)} />
              </div>
            </motion.aside>
          ) : (
            <motion.div
              key="inspector-mobile"
              className="fixed inset-0 z-50 flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="bg-charcoal-900/40 absolute inset-0 backdrop-blur-[2px]"
                onClick={() => setInspectorOpen(false)}
                aria-hidden
              />
              <motion.aside
                aria-label="Agent trace inspector"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={spring}
                className="glass-strong relative h-full w-[92vw] max-w-[460px] rounded-l-[var(--radius-panel)]"
              >
                <TraceInspector onClose={() => setInspectorOpen(false)} />
              </motion.aside>
            </motion.div>
          )
        ) : null}
      </AnimatePresence>
    </div>
  )
}
