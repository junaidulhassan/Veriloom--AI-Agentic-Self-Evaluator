import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

export function useCountUp(target: number, options: { duration?: number; enabled?: boolean } = {}) {
  const { duration = 1.1, enabled = true } = options
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced || !enabled ? target : 0)
  const previous = useRef(reduced || !enabled ? target : 0)

  useEffect(() => {
    if (!enabled) return
    if (reduced || !Number.isFinite(target)) {
      previous.current = target
      setValue(target)
      return
    }
    const controls = animate(previous.current, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(latest),
    })
    previous.current = target
    return () => controls.stop()
  }, [target, duration, enabled, reduced])

  return value
}
