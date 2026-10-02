import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'
import { useUiStore } from '@/store/ui'
import { Background } from './Background'
import { CommandPalette } from './CommandPalette'
import { OfflineBanner } from './OfflineBanner'
import { TopNav } from './TopNav'

export function RootLayout() {
  const location = useLocation()
  const outlet = useOutlet()
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const pageKey = location.pathname.split('/').slice(0, 3).join('/')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(!useUiStore.getState().commandOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen])

  return (
    <div className="text-on-page relative min-h-dvh">
      <a
        href="#main"
        className="bg-charcoal-900 text-cream sr-only z-[200] rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Background />
      <OfflineBanner />
      <TopNav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={pageKey}
          variants={pageTransition}
          initial="hidden"
          animate="show"
          exit="exit"
          className="pt-3"
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <CommandPalette />
    </div>
  )
}
