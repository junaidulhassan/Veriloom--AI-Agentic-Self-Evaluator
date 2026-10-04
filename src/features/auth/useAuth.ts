import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { accountApi, authApi } from '@/api/auth'
import { toApiError } from '@/api/errors'
import { qk } from '@/api/keys'
import { onUnauthorized } from '@/api/session'
import { useChatStore } from '@/features/chat/store'
import type { LoginRequest, RegisterRequest, User } from '@/types/api'

async function fetchMe(): Promise<User | null> {
  try {
    return await authApi.me()
  } catch (error) {
    if (toApiError(error).isUnauthorized) return null
    throw error
  }
}

function startSession(queryClient: QueryClient, user: User) {
  const previous = queryClient.getQueryData<User | null>(qk.me)
  if (previous?.id !== user.id) {
    useChatStore.getState().reset()
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
    queryClient.removeQueries({ queryKey: qk.account })
  }
  queryClient.setQueryData(qk.me, user)
}

export function endSession(queryClient: QueryClient) {
  useChatStore.getState().reset()
  queryClient.cancelQueries()
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
  queryClient.setQueryData(qk.me, null)
  queryClient.removeQueries({ queryKey: qk.account })
}

export function useCurrentUser() {
  return useQuery({ queryKey: qk.me, queryFn: fetchMe, staleTime: 5 * 60_000, retry: 1 })
}

export function useSessionWatcher() {
  const queryClient = useQueryClient()
  useEffect(
    () =>
      onUnauthorized(() => {
        if (queryClient.getQueryData(qk.me)) endSession(queryClient)
      }),
    [queryClient],
  )
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    meta: { silent: true },
    mutationFn: () => authApi.logout(),
    onSettled: () => endSession(queryClient),
  })
}

export function useAccountSummary() {
  return useQuery({ queryKey: qk.account, queryFn: accountApi.summary })
}
