import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Reveals a list of steps one after another, once `active` is true.
 *
 * Returns how many steps have been reached — `0` before anything starts,
 * `count` when the sequence is done. Callers compare against it rather than
 * holding a boolean per step.
 *
 * Under reduced motion it returns `count` immediately: the sequence is a way
 * of explaining an order, not information in itself, so someone who has asked
 * for stillness simply gets the finished picture.
 */
export function useSequence(active: boolean, count: number, stepMs = 420, startMs = 200): number {
  const reduced = useReducedMotion()
  const [reached, setReached] = useState(0)

  useEffect(() => {
    if (!active) return

    if (reduced) {
      setReached(count)
      return
    }

    setReached(0)
    const timers = Array.from({ length: count }, (_, i) =>
      window.setTimeout(() => setReached(i + 1), startMs + i * stepMs),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [active, count, stepMs, startMs, reduced])

  return reached
}
