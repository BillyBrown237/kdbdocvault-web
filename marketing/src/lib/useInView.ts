import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has entered the viewport, and true forever after.
 *
 * Entrance animations below the fold are wasted if they play on page load —
 * the visitor arrives to a section that has already finished moving. This ties
 * them to the scroll position instead.
 *
 * It disconnects after the first intersection (nothing here needs to replay)
 * and it fails open: if IntersectionObserver is missing, the content is shown
 * rather than hidden.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, inView }
}
