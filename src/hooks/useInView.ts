import { useEffect, useRef, useState } from 'react'

export function useInView<T extends Element>(options: { once?: boolean; rootMargin?: string } = {}) {
  const { once = true, rootMargin = '0px 0px -10% 0px' } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [once, rootMargin])

  return { ref, inView }
}
