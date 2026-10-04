export type ISODate = string
export type JsonRecord = Record<string, unknown>

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface DeleteResult {
  deleted: number
  details: JsonRecord
}

export interface ErrorBody {
  code: string
  message: string
  details: JsonRecord
  request_id: string | null
}

export interface CountItem {
  key: string | null
  count: number
}

export interface TimeWindowParams {
  start?: string
  end?: string
}

export interface PageParams {
  page?: number
  page_size?: number
}

export interface ChatRequest {
  message: string
  conversation_id?: string | null
}

export interface ToolCallSummary {
  id: string | null
  tool_call_id: string
  tool_name: string
  arguments: JsonRecord
  status: string
  attempt: number
  duration_ms: number
  output_preview: string
  error?: string | null
  error_type?: string | null
}

export interface Source {
  type: 'web' | 'document'
  title?: string | null
  url?: string | null
  document_id?: string | null
  chunk_id?: number | null
  page?: number | null
  score?: number | null
}

export interface EvaluationSummary {
  evaluation_id?: string | null
  attempt: number
  passed?: boolean | null
  is_correct?: boolean | null
  is_hallucination?: boolean | null
  is_relevant?: boolean | null
  is_supported?: boolean | null
  tool_results_interpreted_correctly?: boolean | null
  is_logically_consistent?: boolean | null
  is_well_written?: boolean | null
  confidence?: number | null
  quality_score?: number | null
  needs_retry: boolean
  reason?: string | null
  suggested_fix?: string | null
  missing_information: string[]
  issues: string[]
  error?: string | null
  duration_ms?: number | null
}

export interface TokenUsageSummary {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  llm_calls: number
  by_component: Record<string, number>
}

export interface ChatError {
  code: string
  message: string
}

export interface ChatResponse {
  request_id: string
  conversation_id: string
  status: 'completed' | 'failed'
  answer: string
  error?: ChatError | null
  attempts: number
  retries: number
  self_corrected: boolean
  selected_attempt: number
  evaluation?: EvaluationSummary | null
  evaluation_history: EvaluationSummary[]
  tool_calls: ToolCallSummary[]
  sources: Source[]
  token_usage: TokenUsageSummary
  latency_ms: number
  created_at: ISODate
}

export interface MessageOut {
  id: string
  role: 'user' | 'assistant' | string
  content: string
  request_id: string | null
  created_at: ISODate
}

export interface ConversationOut {
  id: string
  title: string
  message_count: number
  created_at: ISODate
  updated_at: ISODate
}

export interface ConversationDetail extends ConversationOut {
  messages: MessageOut[]
}

export type StreamEvent =
  | { type: 'start'; request_id: string; conversation_id: string }
  | {
      type: 'agent_step'
      attempt: number
      iteration: number | null
      content: string
      tool_calls: { id: string | null; name: string; args: JsonRecord }[]
    }
  | ({ type: 'tool_result' } & ToolCallSummary)
  | ({ type: 'evaluation' } & EvaluationSummary)
  | { type: 'retry'; attempt: number }
  | { type: 'error'; request_id: string; error: ChatError | null }
  | { type: 'final'; response: ChatResponse }

export interface AgentRequestOut {
  id: string
  conversation_id: string | null
  question: string
  final_answer: string | null
  status: 'running' | 'completed' | 'failed' | 'cancelled' | string
  error_message: string | null
  attempts: number
  retries: number
  self_corrected: boolean
  tool_call_count: number
  llm_call_count: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  latency_ms: number | null
  is_correct: boolean | null
  is_hallucination: boolean | null
  is_relevant: boolean | null
  is_well_written: boolean | null
  confidence: number | null
  quality_score: number | null
  created_at: ISODate
  completed_at: ISODate | null
}

export interface ToolExecutionOut {
  id: string
  request_id: string | null
  conversation_id: string | null
  tool_call_id: string | null
  tool_name: string
  attempt: number
  arguments: JsonRecord
  output: string | null
  output_metadata: JsonRecord
  status: string
  error_type: string | null
  error_message: string | null
  duration_ms: number
  selection_correct: boolean | null
  output_reliable: boolean | null
  caused_false_information: boolean | null
  assessment_note: string | null
  token_usage_id: string | null
  created_at: ISODate
}

export interface EvaluationOut {
  id: string
  request_id: string
  conversation_id: string | null
  attempt: number
  answer: string
  is_correct: boolean
  is_hallucination: boolean
  is_relevant: boolean
  is_supported: boolean
  tool_results_interpreted_correctly: boolean
  is_logically_consistent: boolean
  is_well_written: boolean
  missing_information: string[]
  confidence: number
  quality_score: number
  needs_retry: boolean
  reason: string
  suggested_fix: string | null
  is_final: boolean
  duration_ms: number
  created_at: ISODate
}

export interface EvaluationHistoryItem extends EvaluationOut {
  question: string | null
}

export interface TokenUsageOut {
  id: string
  request_id: string | null
  conversation_id: string | null
  component: string
  attempt: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  tool_names: string[]
  duration_ms: number
  created_at: ISODate
}

export interface TraceEventOut {
  id: string
  sequence: number
  event_type:
    | 'llm_call'
    | 'tool_result'
    | 'evaluation'
    | 'retry'
    | 'retry_budget_exhausted'
    | 'final'
    | 'error'
    | string
  attempt: number
  payload: JsonRecord
  created_at: ISODate
}

export interface CodeExecutionOut {
  id: string
  request_id: string | null
  conversation_id: string | null
  code: string
  stdin: string | null
  status: 'success' | 'error' | 'timeout' | 'sandbox_error' | string
  stdout: string
  stderr: string
  exit_code: number | null
  exception_type: string | null
  exception_message: string | null
  timed_out: boolean
  duration_ms: number
  backend: string
  created_at: ISODate
}

export interface ErrorLogOut {
  id: string
  request_id: string | null
  conversation_id: string | null
  category: string
  source: string
  error_type: string
  message: string
  details: JsonRecord
  created_at: ISODate
}

export interface RetrievalHitOut {
  rank: number
  chunk_id: number | null
  document_id: string | null
  score: number
  is_relevant: boolean
}

export interface RetrievalOut {
  id: string
  request_id: string | null
  conversation_id: string | null
  source: string
  query: string
  top_k: number
  document_filter: string[]
  result_count: number
  relevant_count: number
  max_score: number | null
  avg_score: number | null
  success: boolean
  error_message: string | null
  duration_ms: number
  created_at: ISODate
  hits: RetrievalHitOut[]
}

export interface TraceSummary {
  attempts: number
  llm_calls: number
  tool_calls: number
  failed_tool_calls: number
  tool_usage: Record<string, number>
  total_tokens: number
  llm_time_ms: number
  tool_time_ms: number
  evaluation_time_ms: number
  errors: number
}

export interface ExecutionTrace {
  request: AgentRequestOut
  messages: MessageOut[]
  timeline: TraceEventOut[]
  tool_executions: ToolExecutionOut[]
  evaluations: EvaluationOut[]
  token_usage: TokenUsageOut[]
  retrievals: RetrievalOut[]
  code_executions: CodeExecutionOut[]
  errors: ErrorLogOut[]
  summary: TraceSummary
}

export interface DocumentOut {
  id: string
  filename: string
  title: string | null
  author: string | null
  status: string
  file_size_bytes: number
  page_count: number
  chunk_count: number
  character_count: number
  content_hash: string
  embedding_model: string
  embedding_dimension: number
  chunk_size: number
  chunk_overlap: number
  processing_ms: number
  metadata: JsonRecord
  error_message: string | null
  created_at: ISODate
  retrieval_count: number | null
}

export interface ChunkOut {
  id: number
  document_id: string
  document_name: string | null
  chunk_index: number
  page_start: number
  page_end: number
  char_count: number
  token_estimate: number
  start_offset: number
  embedding_model: string
  embedding_dimension: number
  embedding_norm: number | null
  vector_id: number
  is_indexed: boolean
  retrieval_count: number
  created_at: ISODate
  text?: string | null
  preview?: string | null
}

export interface ChunkRetrievalRecord {
  retrieval_id: string
  query: string
  request_id: string | null
  conversation_id: string | null
  source: string
  rank: number
  score: number
  is_relevant: boolean
  retrieved_at: ISODate
}

export interface ChunkDetail extends ChunkOut {
  retrieval_stats: {
    hits: number
    avg_score: number | null
    max_score: number | null
    min_score: number | null
  }
  retrieval_history: ChunkRetrievalRecord[]
  embedding_vector?: number[] | null
}

export interface DocumentDetail extends DocumentOut {
  stats: {
    chunks: number
    avg_chunk_chars: number
    min_chunk_chars: number
    max_chunk_chars: number
    total_retrievals: number
    estimated_tokens: number
    retrieval_hits: number
    avg_similarity: number | null
    max_similarity: number | null
  }
  chunks_per_page: { page: number; chunks: number }[]
  most_retrieved_chunks: ChunkOut[]
  file_available: boolean
}

export interface UploadFailure {
  filename: string
  code: string
  message: string
  details: JsonRecord
}

export interface UploadResponse {
  uploaded: DocumentOut[]
  failed: UploadFailure[]
}

export interface SemanticSearchRequest {
  query: string
  top_k?: number
  document_ids?: string[] | null
  min_score?: number | null
}

export interface SearchHit {
  rank: number
  chunk_id: number
  document_id: string
  document_name: string
  chunk_index: number
  page_start: number
  page_end: number
  score: number
  is_relevant: boolean
  text: string
}

export interface SemanticSearchResponse {
  retrieval_id: string
  query: string
  duration_ms: number
  success: boolean
  results: SearchHit[]
}

export interface DocumentDeleteResponse {
  document_id: string
  deleted_chunks: number
  removed_vectors: number
}

export interface ChunkDeleteResponse {
  chunk_id: number
  document_id: string
  removed_vectors: number
  remaining_chunks: number
}

export interface ReindexResponse {
  document_id: string | null
  reindexed_chunks: number
  index_size: number
  embedding_model: string
  dimension: number
  duration_ms: number
}

export interface IndexStatus {
  vectors: number
  stale: boolean
  documents: number
  database_chunks: number
  in_sync: boolean
  embedding_model_loaded: boolean
  embedding_load_error: string | null
  ready: boolean
  [key: string]: unknown
}

export interface ToolInfo {
  name: string
  description: string
  category: string
  available: boolean
  unavailable_reason: string | null
  timeout_seconds: number | null
  parameters: JsonRecord
}

export interface Percentiles {
  count: number
  avg: number
  min: number
  p50: number
  p90: number
  p95: number
  p99: number
  max: number
  total: number
}

export interface OverviewStats {
  total_conversations: number
  total_questions: number
  completed_requests: number
  failed_requests: number
  running_requests: number
  total_documents: number
  total_chunks: number
  total_tool_calls: number
  total_evaluations: number
  total_retrievals: number
  total_errors: number
  total_tokens: number
  avg_latency_ms: number
  accuracy_rate: number
  hallucination_rate: number
  tool_success_rate: number
  rag_retrieval_success_rate: number
  self_correction_rate: number
  avg_tool_calls_per_question: number
  registered_tools: number
  generated_at: ISODate
}

export interface ResponseQualityStats {
  total_questions: number
  evaluated: number
  unevaluated: number
  correct: number
  incorrect: number
  hallucinated: number
  well_written: number
  relevant: number
  irrelevant: number
  failed: number
  self_corrected: number
  retried: number
  accuracy_rate: number
  incorrect_rate: number
  hallucination_rate: number
  relevance_rate: number
  irrelevant_rate: number
  well_written_rate: number
  response_quality_rate: number
  avg_confidence: number
  failure_rate: number
  self_correction_rate: number
}

export interface AgentPerformanceStats {
  total_questions: number
  completed: number
  failed: number
  accuracy_rate: number
  hallucination_rate: number
  failure_rate: number
  retry_rate: number
  self_correction_rate: number
  retry_success_rate: number
  avg_attempts: number
  avg_tool_calls_per_question: number
  max_tool_calls_per_question: number
  questions_without_tools: number
  multi_tool_questions: number
  avg_llm_calls_per_question: number
  avg_tokens_per_question: number
  total_tokens: number
  latency: Percentiles
  tool_calls_distribution: Record<string, number>
  tool_selection_accuracy: number
  evaluator_pass_rate_first_attempt: number
}

export interface ToolStats {
  tool_name: string
  registered: boolean
  available: boolean | null
  category: string | null
  total_calls: number
  successful_calls: number
  failed_calls: number
  success_rate: number
  failure_rate: number
  error_types: Record<string, number>
  assessed_calls: number
  incorrect_selections: number
  incorrect_selection_rate: number
  reliable_outputs: number
  unreliable_outputs: number
  reliability_rate: number
  false_information_count: number
  duration: Percentiles
  attributed_tokens: number
  requests_using_tool: number
  last_called_at: ISODate | null
}

export interface DailyToolPoint {
  date: string
  calls: number
  failures: number
  avg_duration_ms: number
}

export interface ToolDetail extends ToolStats {
  daily: DailyToolPoint[]
  common_errors: CountItem[]
}

export interface TokenGroupRow {
  key: string | null
  label?: string | null
  llm_calls: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  requests?: number | null
}

export interface TokenSummary {
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  llm_calls: number
  requests: number
  avg_tokens_per_request: number
  avg_tokens_per_llm_call: number
  avg_input_tokens_per_request: number
  avg_output_tokens_per_request: number
  by_component: TokenGroupRow[]
  by_tool: TokenGroupRow[]
  by_day: TokenGroupRow[]
}

export type TokenGroupBy = 'request' | 'session' | 'day' | 'component' | 'tool'

export interface LatencyDailyPoint {
  date: string
  requests: number
  avg_latency_ms: number
  p95_latency_ms: number
}

export interface LatencyStats {
  requests: Percentiles
  llm_calls: Record<string, Percentiles>
  tools: Record<string, Percentiles>
  retrieval: Percentiles
  evaluation: Percentiles
  code_execution: Percentiles
  daily: LatencyDailyPoint[]
}

export interface ErrorDailyPoint {
  date: string
  total: number
  [category: string]: number | string
}

export interface ErrorStats {
  total_errors: number
  failed_requests: number
  failed_tool_calls: number
  evaluation_failures: number
  by_category: CountItem[]
  by_source: CountItem[]
  by_type: CountItem[]
  tool_errors_by_tool: Record<string, number>
  daily: ErrorDailyPoint[]
}

export interface HallucinationItem {
  request_id: string
  evaluation_id: string
  question: string | null
  answer_preview: string
  reason: string
  confidence: number
  attempt: number
  is_final: boolean
  corrected: boolean
  created_at: ISODate
}

export interface HallucinationStats {
  evaluated_requests: number
  hallucinated_final: number
  hallucination_rate: number
  hallucinations_detected: number
  detection_rate_all_attempts: number
  corrected_hallucinations: number
  correction_rate: number
  by_tool_involved: Record<string, number>
  daily: { date: string; evaluated: number; hallucinated: number; rate: number }[]
  recent: HallucinationItem[]
}

export interface TopChunk {
  chunk_id: number
  document_id: string
  document_name: string
  page_start: number
  retrieval_count: number
  preview: string
}

export interface TopDocument {
  document_id: string
  document_name: string
  retrieval_hits: number
  avg_score: number | null
}

export interface RagStats {
  documents: number
  ready_documents: number
  total_pages: number
  total_chunks: number
  total_characters: number
  avg_chunks_per_document: number
  avg_chunk_chars: number
  retrievals: number
  successful_retrievals: number
  failed_retrievals: number
  retrieval_success_rate: number
  agent_retrievals: number
  api_retrievals: number
  avg_top_score: number | null
  avg_score: number | null
  avg_results_per_retrieval: number
  avg_relevant_per_retrieval: number
  retrieval_latency: Percentiles
  chunks_retrieved_at_least_once: number
  chunks_never_retrieved: number
  chunk_coverage_rate: number
  score_distribution: CountItem[]
  top_chunks: TopChunk[]
  top_documents: TopDocument[]
  index: JsonRecord
}

export interface DocumentStatsRow {
  document_id: string
  filename: string
  status: string
  page_count: number
  chunk_count: number
  file_size_bytes: number
  character_count: number
  retrieval_count: number
  retrieval_hits: number
  avg_score: number | null
  created_at: ISODate
}

export interface ChunkStats {
  total_chunks: number
  avg_chars: number
  min_chars: number
  max_chars: number
  avg_token_estimate: number
  total_token_estimate: number
  retrieved_chunks: number
  size_distribution: CountItem[]
  chunks_per_document: CountItem[]
  retrieval_count_distribution: CountItem[]
}

export interface TimeseriesPoint {
  date: string
  questions: number
  completed: number
  failed: number
  correct: number
  incorrect: number
  hallucinated: number
  self_corrected: number
  avg_latency_ms: number
  tool_calls: number
  tool_failures: number
  retrievals: number
  tokens: number
  errors: number
}

export interface RecentConversation {
  id: string
  title: string
  message_count: number
  request_count: number
  last_question: string | null
  last_status: string | null
  created_at: ISODate
  updated_at: ISODate
}

export interface HeatmapCell {
  tool_name: string
  weekday: number
  hour: number
  count: number
}

export interface DailyRetrievalPoint {
  date: string
  retrievals: number
  successful: number
  success_rate: number
  avg_top_score: number | null
}

export interface ActivityStats {
  tool_heatmap: HeatmapCell[]
  latency_histogram: CountItem[]
  retry_distribution: CountItem[]
  attempts_distribution: CountItem[]
  retrieval_daily: DailyRetrievalPoint[]
}

export interface RequestEvaluationTrail {
  request_id: string
  question: string
  attempts: number
  self_corrected: boolean
  final_answer: string | null
  evaluations: EvaluationOut[]
  created_at: ISODate
  status: string
  is_hallucination: boolean | null
  is_correct: boolean | null
  confidence: number | null
}

export interface SystemInfo {
  app_name: string
  version: string
  environment: string
  embedding: JsonRecord
  rag: JsonRecord
  agent: JsonRecord
  sandbox: JsonRecord
  tools: JsonRecord[]
}

export interface SelectionFilter {
  before?: string | null
  after?: string | null
  delete_all?: boolean
}

export interface EvaluationDeleteRequest extends SelectionFilter {
  evaluation_ids?: string[] | null
  request_ids?: string[] | null
  only_non_final?: boolean
  reset_request_flags?: boolean
}

export interface RequestDeleteRequest extends SelectionFilter {
  request_ids?: string[] | null
  statuses?: ('running' | 'completed' | 'failed' | 'cancelled')[] | null
}

export interface ConversationClearRequest extends SelectionFilter {
  conversation_ids?: string[] | null
  purge_requests?: boolean
}

export interface ErrorClearRequest extends SelectionFilter {
  error_ids?: string[] | null
  categories?: string[] | null
}

export interface CodeExecutionClearRequest extends SelectionFilter {
  execution_ids?: string[] | null
}

export interface RetrievalClearRequest extends SelectionFilter {
  retrieval_ids?: string[] | null
  sources?: string[] | null
}

export interface ResetMetricsRequest {
  confirm: 'RESET'
  reset_chunk_counters?: boolean
}

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  created_at: ISODate
  last_login_at: ISODate | null
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ProfileUpdateRequest {
  first_name?: string
  last_name?: string
  email?: string
  current_password?: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface AccountDeleteRequest {
  password: string
  confirm: 'DELETE'
}

export interface AccountSummary {
  user: User
  conversations: number
  messages: number
  documents: number
  chunks: number
  requests: number
  active_sessions: number
}
