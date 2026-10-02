import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatApi } from '@/api/chat'
import { describeError, toApiError } from '@/api/errors'
import { qk } from '@/api/keys'
import { StreamUnsupportedError, streamChat } from '@/api/sse'
import { env } from '@/lib/env'
import { sleep } from '@/lib/utils'
import { eventsFromResponse } from '@/features/trace/fromResponse'
import { initialTraceState, reduceTrace } from '@/features/trace/reducer'
import type { StreamEvent } from '@/types/api'
import { selectBusy, useChatStore } from '../store'
import { useMaxAttempts } from './useMaxAttempts'

let seq = 0
const turnKey = () => `turn-${Date.now().toString(36)}-${(seq++).toString(36)}`

const revealDelay = (event: StreamEvent) => {
  if (event.type === 'tool_result') return 650
  if (event.type === 'evaluation') return 700
  if (event.type === 'retry') return 600
  if (event.type === 'final') return 450
  return 420
}

export function useChat() {
  const queryClient = useQueryClient()
  const controller = useRef<AbortController | null>(null)
  const maxAttempts = useMaxAttempts()
  const busy = useChatStore(selectBusy)

  const refresh = useCallback(
    (conversationId?: string | null) => {
      queryClient.invalidateQueries({ queryKey: qk.conversationsRoot })
      if (conversationId) queryClient.invalidateQueries({ queryKey: qk.conversation(conversationId) })
      queryClient.invalidateQueries({ queryKey: qk.dashboardRoot })
    },
    [queryClient],
  )

  const send = useCallback(
    async (rawMessage: string): Promise<boolean> => {
      const message = rawMessage.trim()
      const store = useChatStore.getState()
      if (!message || selectBusy(store)) return false
      const key = turnKey()
      const abort = new AbortController()
      controller.current = abort
      let conversationId = store.activeConversationId
      let started = false
      let lastEventAt = Date.now()
      const watchdog = setInterval(() => {
        if (Date.now() - lastEventAt > env.chatTimeoutMs)
          abort.abort(new DOMException('Timed out', 'TimeoutError'))
      }, 1000)

      store.addTurn({
        key,
        conversationId,
        question: message,
        createdAt: Date.now(),
        status: 'sending',
        mode: 'stream',
        trace: initialTraceState(maxAttempts),
        revealed: false,
      })

      const apply = (event: StreamEvent) => {
        lastEventAt = Date.now()
        const state = useChatStore.getState()
        if (event.type === 'start') {
          started = true
          conversationId = event.conversation_id
          if (state.activeConversationId !== event.conversation_id)
            state.setActiveConversation(event.conversation_id)
          queryClient.invalidateQueries({ queryKey: qk.conversationsRoot })
        }
        state.updateTurn(key, (turn) => {
          const trace = reduceTrace(turn.trace, event)
          return {
            ...turn,
            trace,
            conversationId: trace.conversationId ?? turn.conversationId,
            requestId: trace.requestId ?? turn.requestId,
            response: event.type === 'final' ? event.response : turn.response,
            status:
              event.type === 'final' ? (event.response.status === 'failed' ? 'failed' : 'done') : 'streaming',
            error: event.type === 'final' && event.response.error ? event.response.error.message : turn.error,
          }
        })
      }

      try {
        try {
          await streamChat({ message, conversation_id: conversationId }, apply, abort.signal)
        } catch (error) {
          if (!(error instanceof StreamUnsupportedError)) throw error
          useChatStore
            .getState()
            .updateTurn(key, (turn) => ({ ...turn, mode: 'fallback', status: 'streaming' }))
          const response = await chatApi.send({ message, conversation_id: conversationId }, abort.signal)
          for (const event of eventsFromResponse(response)) {
            apply(event)
            if (event.type !== 'final') await sleep(revealDelay(event), abort.signal)
          }
        }
        const turn = useChatStore.getState().turns.find((item) => item.key === key)
        if (turn && turn.status !== 'done' && turn.status !== 'failed') {
          useChatStore.getState().updateTurn(key, (current) => ({
            ...current,
            status: 'failed',
            error: 'The stream ended before the agent finished. Try again.',
            trace: { ...current.trace, status: 'failed' },
          }))
        }
        return true
      } catch (error) {
        const timedOut =
          abort.signal.reason instanceof DOMException && abort.signal.reason.name === 'TimeoutError'
        const cancelled = abort.signal.aborted && !timedOut
        if (cancelled) {
          useChatStore.getState().updateTurn(key, (turn) => ({
            ...turn,
            status: 'cancelled',
            trace: {
              ...turn.trace,
              status: 'failed',
              steps: turn.trace.steps.map((step) =>
                step.status === 'running'
                  ? { ...step, status: 'skipped', title: `${step.title} (stopped)` }
                  : step,
              ),
            },
          }))
          return true
        }
        if (!started) {
          useChatStore.getState().removeTurn(key)
          useChatStore.getState().setDraft(message)
          toast.error(timedOut ? 'The request timed out before the agent started.' : describeError(error), {
            action: { label: 'Retry', onClick: () => void send(message) },
          })
          return false
        }
        const err = toApiError(error)
        useChatStore.getState().updateTurn(key, (turn) => ({
          ...turn,
          status: 'failed',
          error: timedOut
            ? 'The agent took too long to respond and the request timed out.'
            : describeError(err),
          trace: reduceTrace(turn.trace, {
            type: 'error',
            request_id: turn.requestId ?? '',
            error: { code: timedOut ? 'timeout' : err.code, message: err.message },
          }),
        }))
        return true
      } finally {
        clearInterval(watchdog)
        if (controller.current === abort) controller.current = null
        refresh(conversationId)
      }
    },
    [maxAttempts, queryClient, refresh],
  )

  const stop = useCallback(() => {
    controller.current?.abort()
  }, [])

  return { send, stop, busy }
}
