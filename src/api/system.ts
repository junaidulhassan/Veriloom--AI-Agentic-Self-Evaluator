import type { ToolInfo } from '@/types/api'
import { get } from './client'

export const systemApi = {
  tools: () => get<ToolInfo[]>('/tools'),
  tool: (name: string) => get<ToolInfo>(`/tools/${encodeURIComponent(name)}`),
}
