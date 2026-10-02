import type {
  ChatError,
  ChatResponse,
  CodeExecutionOut,
  EvaluationSummary,
  JsonRecord,
  StreamEvent,
} from '@/types/api'

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'
export type StepKind = 'thinking' | 'tool' | 'evaluation' | 'retry' | 'final' | 'error'

export interface ToolAssessment {
  selectionCorrect: boolean | null
  outputReliable: boolean | null
  causedFalseInformation: boolean | null
  note: string | null
}

export interface TraceStep {
  id: string
  kind: StepKind
  status: StepStatus
  attempt: number
  startedAt: number
  durationMs?: number
  title: string
  content?: string
  toolName?: string
  toolCallId?: string
  args?: JsonRecord
  output?: string
  metadata?: JsonRecord
  error?: string | null
  errorType?: string | null
  evaluation?: EvaluationSummary
  codeExecution?: CodeExecutionOut
  retryReason?: string | null
  nextAttempt?: number
  tokens?: number
  assessment?: ToolAssessment
}

export interface TraceState {
  status: 'idle' | 'running' | 'done' | 'failed'
  steps: TraceStep[]
  attempt: number
  maxAttempts: number
  startedAt: number
  endedAt?: number
  requestId?: string
  conversationId?: string
  response?: ChatResponse
  error?: ChatError | null
}

export type TimedEvent = StreamEvent & { at?: number }
