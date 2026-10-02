import { useEffect, useState } from 'react'
import { formatDuration } from '@/lib/format'

export function ElapsedTimer({ since, className }: { since: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [])
  return (
    <span className={className} aria-live="off">
      {formatDuration(Math.max(0, now - since))}
    </span>
  )
}
