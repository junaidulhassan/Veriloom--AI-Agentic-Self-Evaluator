import { memo } from 'react'
import { motion } from 'framer-motion'
import { Clock, Coins, Repeat2 } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { getToolConfig } from '@/features/tools/registry'
import { formatDuration, formatNumber } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import type { MessageMeta } from '../meta'
import { VerificationBadge } from './VerificationBadge'

const chip =
  'inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface-strong/70 px-2.5 text-[11.5px] font-semibold text-ink-soft'

export const MetadataRow = memo(function MetadataRow({ meta }: { meta: MessageMeta }) {
  return (
    <motion.div
      variants={stagger(0.04)}
      initial="hidden"
      animate="show"
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Response metadata"
    >
      <motion.span variants={fadeUp}>
        <VerificationBadge verdict={meta.verdict} confidence={meta.confidence} reason={meta.reason} />
      </motion.span>
      <motion.span variants={fadeUp} className={chip}>
        <Clock className="size-3" aria-hidden />
        {formatDuration(meta.latencyMs)}
      </motion.span>
      <Tooltip
        content={`${formatNumber(meta.inputTokens)} input · ${formatNumber(meta.outputTokens)} output`}
      >
        <motion.span variants={fadeUp} className={chip} tabIndex={0}>
          <Coins className="size-3" aria-hidden />
          {formatNumber(meta.totalTokens)} tokens
        </motion.span>
      </Tooltip>
      {meta.tools.map((name) => {
        const config = getToolConfig(name)
        const Icon = config.icon
        return (
          <Tooltip key={name} content={config.label}>
            <motion.span variants={fadeUp} className={chip} tabIndex={0}>
              <Icon className="size-3" style={{ color: config.color }} aria-hidden />
              {config.shortLabel}
            </motion.span>
          </Tooltip>
        )
      })}
      {meta.retries > 0 ? (
        <motion.span variants={fadeUp} className={chip}>
          <Repeat2 className="size-3" aria-hidden />
          {meta.retries} {meta.retries === 1 ? 'retry' : 'retries'}
        </motion.span>
      ) : null}
    </motion.div>
  )
})
