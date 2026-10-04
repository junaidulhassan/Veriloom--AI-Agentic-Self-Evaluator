import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatResponse } from '@/types/api'
import type { TraceState } from '@/features/trace/types'

export type TurnStatus = 'sending' | 'streaming' | 'done' | 'failed' | 'cancelled'

export interface LiveTurn {
  key: string
  conversationId: string | null
  question: string
  createdAt: number
  status: TurnStatus
  mode: 'stream' | 'fallback'
  trace: TraceState
  requestId?: string
  response?: ChatResponse
  error?: string | null
  revealed: boolean
}

interface ChatState {
  activeConversationId: string | null
  selectedRequestId: string | null
  turns: LiveTurn[]
  draft: string
  setActiveConversation: (id: string | null) => void
  newChat: () => void
  selectRequest: (id: string | null) => void
  addTurn: (turn: LiveTurn) => void
  updateTurn: (key: string, updater: (turn: LiveTurn) => LiveTurn) => void
  removeTurn: (key: string) => void
  setDraft: (draft: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      activeConversationId: null,
      selectedRequestId: null,
      turns: [],
      draft: '',
      setActiveConversation: (activeConversationId) => set({ activeConversationId, selectedRequestId: null }),
      newChat: () => set({ activeConversationId: null, selectedRequestId: null }),
      selectRequest: (selectedRequestId) => set({ selectedRequestId }),
      addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
      updateTurn: (key, updater) =>
        set((state) => ({ turns: state.turns.map((turn) => (turn.key === key ? updater(turn) : turn)) })),
      removeTurn: (key) => set((state) => ({ turns: state.turns.filter((turn) => turn.key !== key) })),
      setDraft: (draft) => set({ draft }),
      reset: () => set({ activeConversationId: null, selectedRequestId: null, turns: [], draft: '' }),
    }),
    {
      name: 'veriloom.chat',
      partialize: (state) => ({ activeConversationId: state.activeConversationId, draft: state.draft }),
    },
  ),
)

export const selectBusy = (state: ChatState) =>
  state.turns.some((turn) => turn.status === 'sending' || turn.status === 'streaming')
