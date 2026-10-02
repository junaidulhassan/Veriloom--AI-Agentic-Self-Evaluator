import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function useTypewriter(text: string, enabled: boolean, onDone?: () => void) {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(enabled && !reduced ? 0 : text.length)
  const done = useRef(!enabled || reduced)
  const callback = useRef(onDone)
  callback.current = onDone

  useEffect(() => {
    if (!enabled || reduced) {
      setCount(text.length)
      if (!done.current) {
        done.current = true
        callback.current?.()
      }
      return
    }
    let frame = 0
    let current = 0
    const step = Math.max(2, Math.ceil(text.length / 110))
    const tick = () => {
      current = Math.min(text.length, current + step)
      setCount(current)
      if (current < text.length) frame = requestAnimationFrame(tick)
      else if (!done.current) {
        done.current = true
        callback.current?.()
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, enabled, reduced])

  return { visible: text.slice(0, count), typing: count < text.length }
}
