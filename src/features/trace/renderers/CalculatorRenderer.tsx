import { memo } from 'react'
import { motion } from 'framer-motion'
import { Equal } from 'lucide-react'
import type { TraceStep } from '../types'
import { parseCalculator } from '../parsers'

export const CalculatorRenderer = memo(function CalculatorRenderer({ step }: { step: TraceStep }) {
  const { expression, result } = parseCalculator(step.output ?? '', step.args, step.metadata)
  return (
    <div className="bg-terminal text-terminal-ink flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 font-mono">
      <span className="text-terminal-ink/80 min-w-0 text-[13px] break-all">{expression || 'expression'}</span>
      <Equal className="text-coral-400 size-4 shrink-0" aria-hidden />
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="text-coral-300 text-lg font-bold break-all"
      >
        {step.error ? 'error' : result || '-'}
      </motion.span>
    </div>
  )
})
