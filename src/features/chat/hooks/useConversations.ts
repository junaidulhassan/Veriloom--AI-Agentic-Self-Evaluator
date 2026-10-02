import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatApi } from '@/api/chat'
import { qk } from '@/api/keys'
import type { ConversationOut, Page } from '@/types/api'
import { useChatStore } from '../store'

export function useConversations(search: string) {
  return useQuery({
    queryKey: qk.conversations(search),
    queryFn: () => chatApi.conversations({ page_size: 200, search: search || undefined }),
    placeholderData: (previous) => previous,
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: qk.conversation(id ?? ''),
    queryFn: () => chatApi.conversation(id as string),
    enabled: Boolean(id),
    retry: (count, error) => (error as { status?: number }).status !== 404 && count < 1,
  })
}

type Snapshot = [readonly unknown[], Page<ConversationOut> | undefined][]

function patchLists(
  queryClient: ReturnType<typeof useQueryClient>,
  mapper: (items: ConversationOut[]) => ConversationOut[],
): Snapshot {
  const snapshot = queryClient.getQueriesData<Page<ConversationOut>>({ queryKey: qk.conversationsRoot })
  snapshot.forEach(([key, data]) => {
    if (!data) return
    const items = mapper(data.items)
    queryClient.setQueryData<Page<ConversationOut>>(key, {
      ...data,
      items,
      total: data.total - (data.items.length - items.length),
    })
  })
  return snapshot
}

export function useRenameConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => chatApi.rename(id, title),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: qk.conversationsRoot })
      return {
        snapshot: patchLists(queryClient, (items) =>
          items.map((item) => (item.id === id ? { ...item, title } : item)),
        ),
      }
    },
    onError: (_error, _vars, context) =>
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSuccess: () => toast.success('Conversation renamed'),
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.conversationsRoot })
      queryClient.invalidateQueries({ queryKey: qk.conversation(id) })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, purge }: { id: string; purge?: boolean }) => chatApi.remove(id, purge),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: qk.conversationsRoot })
      const snapshot = patchLists(queryClient, (items) => items.filter((item) => item.id !== id))
      const state = useChatStore.getState()
      const wasActive = state.activeConversationId === id
      if (wasActive) state.newChat()
      return { snapshot, wasActive }
    },
    onError: (_error, { id }, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
      if (context?.wasActive) useChatStore.getState().setActiveConversation(id)
    },
    onSuccess: () => toast.success('Conversation deleted'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.conversationsRoot })
      queryClient.invalidateQueries({ queryKey: qk.dashboardRoot })
    },
  })
}
