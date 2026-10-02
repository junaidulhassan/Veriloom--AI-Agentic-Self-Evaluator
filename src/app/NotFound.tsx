import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Compass, LayoutDashboard, MessageSquareText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Not found')
  return (
    <div className="grid min-h-[calc(100dvh-90px)] place-items-center px-4 pb-10">
      <div className="relative text-center">
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="font-display text-charcoal-900/90 dark:text-coral-500/90 pointer-events-none text-[clamp(120px,26vw,280px)] leading-none font-bold select-none"
        >
          4
          <span className="inline-block align-middle">
            <LogoMark size={180} className="mx-2 inline-block size-[0.72em]" />
          </span>
          4
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong mx-auto mt-4 max-w-md rounded-[var(--radius-panel)] p-6"
        >
          <div className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 mx-auto mb-3 grid size-10 place-items-center rounded-2xl">
            <Compass className="size-5" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-bold">This thread came loose</h1>
          <p className="text-ink-muted mt-1 text-sm">
            The page you are looking for is not woven into Veriloom.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/veriloom/chat/ai-assistant" className={cn(buttonVariants({ size: 'md' }))}>
              <MessageSquareText className="size-4" aria-hidden />
              Open assistant
            </Link>
            <Link
              to="/veriloom/agent_eval/dashboard"
              className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}
            >
              <LayoutDashboard className="size-4" aria-hidden />
              Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
