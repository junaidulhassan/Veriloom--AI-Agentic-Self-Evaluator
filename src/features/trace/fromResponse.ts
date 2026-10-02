import type { ChatResponse, StreamEvent } from '@/types/api'

export function eventsFromResponse(response: ChatResponse): StreamEvent[] {
  const events: StreamEvent[] = [
    {
      type: 'start',
      request_id: response.request_id,
      conversation_id: response.conversation_id,
    },
  ]
  for (let attempt = 1; attempt <= Math.max(1, response.attempts); attempt += 1) {
    const calls = response.tool_calls.filter((call) => call.attempt === attempt)
    if (calls.length) {
      events.push({
        type: 'agent_step',
        attempt,
        iteration: 1,
        content: '',
        tool_calls: calls.map((call) => ({
          id: call.tool_call_id,
          name: call.tool_name,
          args: call.arguments,
        })),
      })
      calls.forEach((call) => events.push({ type: 'tool_result', ...call }))
    }
    events.push({ type: 'agent_step', attempt, iteration: calls.length + 1, content: '', tool_calls: [] })
    const evaluation = response.evaluation_history.find((item) => item.attempt === attempt)
    if (evaluation) events.push({ type: 'evaluation', ...evaluation })
    if (attempt < response.attempts) events.push({ type: 'retry', attempt: attempt + 1 })
  }
  if (response.error) events.push({ type: 'error', request_id: response.request_id, error: response.error })
  events.push({ type: 'final', response })
  return events
}
