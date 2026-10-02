import { memo } from 'react'
import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

export const ChatHeader = memo(function ChatHeader({
  onToggleSidebar,
  onToggleInspector,
  inspectorOpen,
}: {
  onToggleSidebar: () => void
  onToggleInspector: () => void
  inspectorOpen: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-3 pt-1 sm:px-4">
      <Tooltip content="Toggle sidebar">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="glass pointer-events-auto"
        >
          <PanelLeft className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={inspectorOpen ? 'Hide agent trace' : 'Show agent trace'}>
        <Button
          variant={inspectorOpen ? 'primary' : 'ghost'}
          size="icon-sm"
          onClick={onToggleInspector}
          aria-label="Toggle agent trace inspector"
          aria-pressed={inspectorOpen}
          className={inspectorOpen ? 'pointer-events-auto' : 'glass pointer-events-auto'}
        >
          <PanelRight className="size-4" />
        </Button>
      </Tooltip>
    </div>
  )
})
