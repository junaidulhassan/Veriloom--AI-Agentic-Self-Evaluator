import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { qk } from '@/api/keys'

export function useSystemInfo() {
  return useQuery({ queryKey: qk.systemInfo, queryFn: adminApi.system, staleTime: 5 * 60_000, retry: false })
}

export function useMaxAttempts() {
  const { data } = useSystemInfo()
  const retries = Number((data?.agent as { max_retries?: number } | undefined)?.max_retries)
  return Number.isFinite(retries) ? retries + 1 : 3
}
