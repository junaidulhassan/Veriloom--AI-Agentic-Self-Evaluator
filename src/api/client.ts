import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { ApiError, fromErrorBody } from './errors'
import { notifyUnauthorized } from './session'

type RetryConfig = InternalAxiosRequestConfig & { __retryCount?: number }

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.timeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  paramsSerializer: { indexes: null },
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined
    if (axios.isCancel(error)) {
      return Promise.reject(new ApiError({ message: 'Request was cancelled', code: 'aborted' }))
    }
    const status = error.response?.status ?? 0
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    const isNetwork = !error.response && !isTimeout
    const method = (config?.method ?? 'get').toLowerCase()
    const maxRetries = config?.retries ?? (method === 'get' ? env.retries : 0)
    const retryable =
      isNetwork || isTimeout || status === 502 || status === 503 || status === 504 || status === 429
    if (config && retryable && (config.__retryCount ?? 0) < maxRetries) {
      config.__retryCount = (config.__retryCount ?? 0) + 1
      await delay(400 * 2 ** (config.__retryCount - 1))
      return http.request(config)
    }
    if (error.response) {
      if (status === 401 && !config?.url?.startsWith('/auth/')) notifyUnauthorized()
      return Promise.reject(fromErrorBody(status, error.response.data, error.message))
    }
    return Promise.reject(
      new ApiError({
        message: isTimeout ? 'Request timed out' : 'Network error: the API is unreachable',
        code: isTimeout ? 'timeout' : 'network_error',
        isNetwork,
        isTimeout,
      }),
    )
  },
)

export async function get<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await http.get<T>(url, config)
  return data
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const { data } = await http.post<T>(url, body, config)
  return data
}

export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const { data } = await http.patch<T>(url, body, config)
  return data
}

export async function del<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await http.delete<T>(url, config)
  return data
}

export function cleanParams<T extends object>(params?: T) {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

declare module 'axios' {
  interface AxiosRequestConfig {
    retries?: number
  }
}
