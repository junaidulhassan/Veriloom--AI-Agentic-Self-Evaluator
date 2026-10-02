import {
  Activity,
  AlertTriangle,
  Coins,
  Database,
  FileSearch,
  Gauge,
  History,
  LayoutGrid,
  ShieldCheck,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface SectionDef {
  id: string
  letter: string
  label: string
  icon: LucideIcon
}

export const dashboardSections: SectionDef[] = [
  { id: 'overview', letter: 'A', label: 'Overview', icon: LayoutGrid },
  { id: 'quality', letter: 'B', label: 'Response Quality', icon: ShieldCheck },
  { id: 'performance', letter: 'C', label: 'Agent Performance', icon: Activity },
  { id: 'tools', letter: 'D', label: 'Tool Performance', icon: Wrench },
  { id: 'tokens', letter: 'E', label: 'LLM & Tokens', icon: Coins },
  { id: 'latency', letter: 'F', label: 'Latency', icon: Timer },
  { id: 'errors', letter: 'G', label: 'Errors & Hallucinations', icon: AlertTriangle },
  { id: 'rag', letter: 'H', label: 'RAG Analytics', icon: Database },
  { id: 'explorer', letter: 'I', label: 'RAG Explorer', icon: FileSearch },
  { id: 'history', letter: 'J', label: 'Execution History', icon: History },
  { id: 'admin', letter: 'K', label: 'Admin & Controls', icon: Gauge },
]
