import { useState, type ReactNode } from 'react'
import { ChevronDown, FileStack, MessageSquarePlus, Wrench } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { DocumentList } from '@/features/documents/DocumentList'
import { UploadZone } from '@/features/documents/UploadZone'
import { cn } from '@/lib/utils'
import { useChatStore } from '../store'
import { SessionList } from './SessionList'
import { ToolChips } from './ToolChips'

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-line border-t pt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-ink-muted hover:text-ink flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-bold tracking-wider uppercase"
      >
        {icon}
        {title}
        <ChevronDown
          className={cn('ml-auto size-3.5 transition-transform', !open && '-rotate-90')}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[40vh] space-y-3 overflow-y-auto px-1 pt-1 pb-2">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const newChat = useChatStore((s) => s.newChat)
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <Button
        size="md"
        className="w-full"
        onClick={() => {
          newChat()
          onNavigate?.()
        }}
      >
        <MessageSquarePlus className="size-4" />
        New chat
      </Button>
      <SessionList onNavigate={onNavigate} />
      <Section title="Documents" icon={<FileStack className="size-3.5" aria-hidden />}>
        <UploadZone compact />
        <DocumentList />
      </Section>
      <Section title="Tools" icon={<Wrench className="size-3.5" aria-hidden />}>
        <ToolChips />
      </Section>
    </div>
  )
}
