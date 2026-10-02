import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'

export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  const date = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en')

export function formatNumber(
  value: number | null | undefined,
  options?: { compact?: boolean; digits?: number },
) {
  if (value == null || Number.isNaN(value)) return '-'
  if (options?.compact && Math.abs(value) >= 10000) return compact.format(value)
  if (options?.digits != null)
    return value.toLocaleString('en', { maximumFractionDigits: options.digits, minimumFractionDigits: 0 })
  return integer.format(Math.round(value))
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value.toFixed(digits)}%`
}

export function formatRatio(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '-'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatDuration(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms)) return '-'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDateTime(value: string | Date | null | undefined, pattern = 'MMM d, HH:mm') {
  const date = typeof value === 'string' ? parseApiDate(value) : value
  return date ? format(date, pattern) : '-'
}

export function formatRelative(value: string | Date | null | undefined) {
  const date = typeof value === 'string' ? parseApiDate(value) : value
  if (!date) return '-'
  return `${formatDistanceToNowStrict(date)} ago`
}

export function formatDayLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function shortId(id: string | null | undefined, size = 8) {
  if (!id) return '-'
  return id.length > size ? id.slice(0, size) : id
}

export function titleCase(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function truncate(value: string | null | undefined, size = 120) {
  if (!value) return ''
  return value.length > size ? `${value.slice(0, size - 1)}…` : value
}

const modelIdPattern =
  /\b(?:models\/)?(?:gemini|gemma|gpt|claude|llama|mistral)[-\w.]*(?:\s*\(NOT_FOUND\))?/gi

export function sanitizeDisplayText(value: string | null | undefined) {
  if (!value) return value ?? ''
  return value
    .replace(modelIdPattern, 'the language model')
    .replace(/the language model'?\s*\(?the language model\)?/gi, 'the language model')
    .replace(/\btavily\b/gi, 'web search')
    .replace(/\bfaiss\b/gi, 'vector database')
}

export const FRIENDLY_ERROR = 'Something went wrong. Please try again later.'

const loggedErrors = new Set<string>()

export function logHiddenError(value: string) {
  if (loggedErrors.has(value)) return
  loggedErrors.add(value)
  console.error('[veriloom] upstream error hidden from user:', value)
}

const rateLimitPattern =
  /\b429\b|resource_exhausted|quota|rate[\s_-]?limit|too many requests|\b503\b|unavailable|high demand|overloaded/i

export function isRateLimitError(value: string | null | undefined) {
  return Boolean(value && rateLimitPattern.test(value))
}

export function userFacingError(value: string | null | undefined) {
  if (!value) return value ?? ''
  if (isRateLimitError(value)) {
    logHiddenError(value)
    return FRIENDLY_ERROR
  }
  return sanitizeDisplayText(value)
}
