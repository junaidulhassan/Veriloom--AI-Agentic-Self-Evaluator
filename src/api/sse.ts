import { env } from '@/lib/env'
import type { ChatRequest, StreamEvent } from '@/types/api'
import { ApiError, fromErrorBody } from './errors'
import { notifyUnauthorized } from './session'

export class StreamUnsupportedError extends Error {}

export async function streamChat(
  payload: ChatRequest,
  onEvent: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new ApiError({
      message: 'Network error: the API is unreachable',
      code: 'network_error',
      isNetwork: true,
    })
  }
  if (response.status === 404 || response.status === 405)
    throw new StreamUnsupportedError('Streaming endpoint not available')
  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    const body = await response.json().catch(() => undefined)
    throw fromErrorBody(response.status, body, `Request failed with status ${response.status}`)
  }
  if (!response.body || !(response.headers.get('content-type') ?? '').includes('text/event-stream')) {
    throw new StreamUnsupportedError('Response is not an event stream')
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  const flush = (block: string) => {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
    if (!data) return
    try {
      onEvent(JSON.parse(data) as StreamEvent)
    } catch {
      return
    }
  }
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value.replace(/\r\n/g, '\n')
    let index = buffer.indexOf('\n\n')
    while (index !== -1) {
      flush(buffer.slice(0, index))
      buffer = buffer.slice(index + 2)
      index = buffer.indexOf('\n\n')
    }
  }
  if (buffer.trim()) flush(buffer)
}
