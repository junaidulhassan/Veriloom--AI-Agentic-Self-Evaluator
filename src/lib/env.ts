const read = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback

export const env = {
  apiBaseUrl: read(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8000/api/v1').replace(/\/$/, ''),
  timeoutMs: Number(read(import.meta.env.VITE_API_TIMEOUT_MS, '30000')),
  chatTimeoutMs: Number(read(import.meta.env.VITE_CHAT_TIMEOUT_MS, '180000')),
  retries: Number(read(import.meta.env.VITE_API_RETRIES, '2')),
  queryDevtools: read(import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS, 'false') === 'true',
}
