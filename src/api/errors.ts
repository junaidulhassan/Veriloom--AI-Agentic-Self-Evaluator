import { env } from '@/lib/env'
import { sanitizeDisplayText, isRateLimitError, FRIENDLY_ERROR, logHiddenError } from '@/lib/format'
import type { ErrorBody } from '@/types/api'

export class ApiError extends Error {
  status: number
  code: string
  details: Record<string, unknown>
  requestId: string | null
  isNetwork: boolean
  isTimeout: boolean

  constructor(init: {
    message: string
    status?: number
    code?: string
    details?: Record<string, unknown>
    requestId?: string | null
    isNetwork?: boolean
    isTimeout?: boolean
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status ?? 0
    this.code = init.code ?? 'unknown_error'
    this.details = init.details ?? {}
    this.requestId = init.requestId ?? null
    this.isNetwork = init.isNetwork ?? false
    this.isTimeout = init.isTimeout ?? false
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isNotFound() {
    return this.status === 404
  }

  get isRetryable() {
    return this.isNetwork || this.isTimeout || this.status >= 500 || this.status === 429
  }
}

export function fromErrorBody(status: number, body: unknown, fallback: string) {
  const error = (body as { error?: ErrorBody } | undefined)?.error
  if (error) {
    return new ApiError({
      status,
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: error.request_id,
    })
  }
  const detail = (body as { detail?: unknown } | undefined)?.detail
  return new ApiError({ status, message: typeof detail === 'string' ? detail : fallback })
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({ message: 'Request was cancelled', code: 'aborted' })
  }
  if (error instanceof Error)
    return new ApiError({ message: error.message, isNetwork: true, code: 'network_error' })
  return new ApiError({ message: 'Unexpected error' })
}

export function validationMessage(err: ApiError) {
  const errors = (err.details as { errors?: { msg?: string }[] }).errors
  const first = Array.isArray(errors) ? errors.find((item) => item?.msg)?.msg : undefined
  return first ? first.replace(/^Value error,\s*/, '') : null
}

export function describeError(error: unknown) {
  const err = toApiError(error)
  if (err.isTimeout) return 'The request timed out. The agent may still be working; try again shortly.'
  if (err.isNetwork)
    return `Cannot reach the backend API at ${env.apiBaseUrl}. Check that it is running and that ${window.location.origin} is listed in the backend CORS_ORIGINS.`
  if (err.isUnauthorized)
    return err.message && err.message !== 'Not authenticated'
      ? sanitizeDisplayText(err.message)
      : 'Your session has expired. Please sign in again.'
  const validation = validationMessage(err)
  if (validation) return validation
  const lowered = `${err.code} ${err.message}`.toLowerCase()
  if (err.status === 429 || err.code === 'rate_limited' || isRateLimitError(err.message)) {
    logHiddenError(err.message)
    return FRIENDLY_ERROR
  }
  if (err.code === 'llm_error' || err.status >= 500) return FRIENDLY_ERROR
  if (lowered.includes('tavily')) return 'Web search is temporarily unavailable. Please try again later.'
  if (err.code === 'not_configured') return `Service not configured: ${err.message}`
  return sanitizeDisplayText(err.message)
}
