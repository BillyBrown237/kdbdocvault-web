import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the visitor has asked their system to reduce motion.
 *
 * CSS already neutralises declared animations (see the base layer in
 * styles.css). This hook exists for the other half of the problem: animations
 * driven by JS timers, which CSS cannot reach. A component that schedules a
 * state change must check this and jump straight to the end state instead.
 *
 * Starts pessimistic — `true` until the browser confirms otherwise — so the
 * very first render never fires motion at someone who asked for none.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
