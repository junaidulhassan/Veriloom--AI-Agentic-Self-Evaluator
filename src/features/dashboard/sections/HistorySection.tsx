import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  History,
  MessageSquareText,
  Repeat2,
  ShieldCheck,
  SquareTerminal,
  Waypoints,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Section } from '../components/Section'
import { ConversationsPanel } from '../history/ConversationsPanel'
import { EvaluationsPanel } from '../history/EvaluationsPanel'
import { PythonLogsPanel } from '../history/PythonLogsPanel'
import { SelfCorrectionsPanel } from '../history/SelfCorrectionsPanel'
import { ToolExecutionsPanel } from '../history/ToolExecutionsPanel'
import { TraceViewerPanel } from '../history/TraceViewerPanel'

const tabs = [
  { value: 'conversations', label: 'Conversations', icon: <MessageSquareText className="size-3.5" /> },
  { value: 'tools', label: 'Tool executions', icon: <Wrench className="size-3.5" /> },
  { value: 'python', label: 'Python logs', icon: <SquareTerminal className="size-3.5" /> },
  { value: 'evaluations', label: 'Evaluations', icon: <ShieldCheck className="size-3.5" /> },
  { value: 'corrections', label: 'Self-corrections', icon: <Repeat2 className="size-3.5" /> },
  { value: 'trace', label: 'Trace viewer', icon: <Waypoints className="size-3.5" /> },
]

export default function HistorySection() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('trace') ? 'trace' : 'conversations')
  return (
    <Section
      id="history"
      description="Every conversation, tool call, sandbox run, evaluation and retry, with drill-down into full execution traces."
    >
      <Card className="p-4 sm:p-5">
        <div className="text-ink-muted mb-1 flex items-center gap-2 text-xs font-semibold">
          <History className="size-3.5" aria-hidden />
          Execution history
        </div>
        <Tabs label="Execution history" value={tab} onValueChange={setTab} tabs={tabs}>
          <TabPanel value="conversations">
            <ConversationsPanel />
          </TabPanel>
          <TabPanel value="tools">
            <ToolExecutionsPanel />
          </TabPanel>
          <TabPanel value="python">
            <PythonLogsPanel />
          </TabPanel>
          <TabPanel value="evaluations">
            <EvaluationsPanel />
          </TabPanel>
          <TabPanel value="corrections">
            <SelfCorrectionsPanel />
          </TabPanel>
          <TabPanel value="trace">
            <TraceViewerPanel />
          </TabPanel>
        </Tabs>
      </Card>
    </Section>
  )
}
