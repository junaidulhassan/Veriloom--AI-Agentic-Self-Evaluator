import { useNavigate } from 'react-router'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  LayoutDashboard,
  MessageSquarePlus,
  MessageSquareText,
  Moon,
  PanelLeft,
  Search,
} from 'lucide-react'
import { Dialog as RD } from 'radix-ui'
import { documentsApi } from '@/api/documents'
import { qk } from '@/api/keys'
import { dashboardSections } from '@/features/dashboard/sections'
import { useChatStore } from '@/features/chat/store'
import { scaleFade } from '@/lib/motion'
import { useSettingsStore } from '@/store/settings'
import { useUiStore } from '@/store/ui'

const itemClass =
  'flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink outline-none data-[selected=true]:bg-charcoal-900 data-[selected=true]:text-cream dark:data-[selected=true]:bg-coral-500 dark:data-[selected=true]:text-charcoal-900'
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-muted'

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const newChat = useChatStore((s) => s.newChat)
  const navigate = useNavigate()
  const documents = useQuery({
    queryKey: qk.documents('palette'),
    queryFn: () => documentsApi.list({ page_size: 50 }),
    enabled: open,
  })

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <RD.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open ? (
          <RD.Portal forceMount>
            <RD.Overlay asChild forceMount>
              <motion.div
                className="bg-charcoal-900/40 fixed inset-0 z-[95] backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RD.Overlay>
            <RD.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                variants={scaleFade}
                initial="hidden"
                animate="show"
                exit="exit"
                className="fixed top-[14vh] left-1/2 z-[96] w-[min(640px,calc(100vw-24px))] -translate-x-1/2"
              >
                <RD.Title className="sr-only">Command palette</RD.Title>
                <Command
                  label="Command palette"
                  className="glass-strong text-ink overflow-hidden rounded-[var(--radius-panel)]"
                  loop
                >
                  <div className="border-line flex items-center gap-3 border-b px-4">
                    <Search className="text-ink-muted size-4" aria-hidden />
                    <Command.Input
                      autoFocus
                      placeholder="Jump to a page, section, document or action"
                      className="placeholder:text-ink-muted h-14 flex-1 bg-transparent text-[15px] outline-none"
                    />
                  </div>
                  <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                    <Command.Empty className="text-ink-muted px-3 py-8 text-center text-sm">
                      No results found.
                    </Command.Empty>
                    <Command.Group heading="Pages" className={groupClass}>
                      <Command.Item
                        className={itemClass}
                        onSelect={() => run(() => navigate('/veriloom/chat/ai-assistant'))}
                      >
                        <MessageSquareText className="size-4" aria-hidden /> AI Assistant
                      </Command.Item>
                      <Command.Item
                        className={itemClass}
                        onSelect={() => run(() => navigate('/veriloom/agent_eval/dashboard'))}
                      >
                        <LayoutDashboard className="size-4" aria-hidden /> Evaluation Dashboard
                      </Command.Item>
                    </Command.Group>
                    <Command.Group heading="Actions" className={groupClass}>
                      <Command.Item
                        className={itemClass}
                        onSelect={() =>
                          run(() => {
                            newChat()
                            navigate('/veriloom/chat/ai-assistant')
                          })
                        }
                      >
                        <MessageSquarePlus className="size-4" aria-hidden /> New chat
                      </Command.Item>
                      <Command.Item className={itemClass} onSelect={() => run(toggleTheme)}>
                        <Moon className="size-4" aria-hidden /> Toggle charcoal mode
                      </Command.Item>
                      <Command.Item className={itemClass} onSelect={() => run(toggleSidebar)}>
                        <PanelLeft className="size-4" aria-hidden /> Toggle chat sidebar
                      </Command.Item>
                    </Command.Group>
                    <Command.Group heading="Dashboard sections" className={groupClass}>
                      {dashboardSections.map((section) => {
                        const Icon = section.icon
                        return (
                          <Command.Item
                            key={section.id}
                            value={`section ${section.label}`}
                            className={itemClass}
                            onSelect={() =>
                              run(() =>
                                navigate(
                                  `/veriloom/agent_eval/dashboard${window.location.search}#${section.id}`,
                                ),
                              )
                            }
                          >
                            <Icon className="size-4" aria-hidden />
                            <span className="flex-1">{section.label}</span>
                            <span className="font-mono text-[11px] opacity-60">{section.letter}</span>
                          </Command.Item>
                        )
                      })}
                    </Command.Group>
                    {documents.data?.items.length ? (
                      <Command.Group heading="Documents" className={groupClass}>
                        {documents.data.items.map((doc) => (
                          <Command.Item
                            key={doc.id}
                            value={`document ${doc.filename} ${doc.id}`}
                            className={itemClass}
                            onSelect={() =>
                              run(() => navigate(`/veriloom/agent_eval/dashboard?doc=${doc.id}#explorer`))
                            }
                          >
                            <FileText className="size-4" aria-hidden />
                            <span className="flex-1 truncate">{doc.filename}</span>
                            <span className="text-[11px] opacity-60">{doc.chunk_count} chunks</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ) : null}
                  </Command.List>
                </Command>
              </motion.div>
            </RD.Content>
          </RD.Portal>
        ) : null}
      </AnimatePresence>
    </RD.Root>
  )
}
