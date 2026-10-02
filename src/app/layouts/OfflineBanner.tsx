import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnline } from '@/hooks/useOnline'

export function OfflineBanner() {
  const online = useOnline()
  return (
    <AnimatePresence>
      {!online ? (
        <motion.div
          role="alert"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[100] flex justify-center p-2"
        >
          <div className="bg-charcoal-900 text-cream flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg">
            <WifiOff className="text-coral-400 size-3.5" aria-hidden />
            You are offline. Messages and dashboard refreshes will resume when the connection returns.
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
