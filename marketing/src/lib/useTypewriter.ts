import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Pass `false` to freeze on the first phrase — used for reduced motion. */
  enabled?: boolean
  typeMs?: number
  deleteMs?: number
  /** How long a completed phrase sits before it is erased. */
  holdMs?: number
  /** `false` types the first phrase once and stops there. */
  loop?: boolean
}

/**
 * Types a phrase out, holds it, erases it, moves to the next one.
 *
 * Used for the search field in the hero mock. Two things matter here and both
 * are easy to get wrong:
 *
 *  - When `enabled` is false the full first phrase is returned immediately.
 *    A reduced-motion visitor still sees a search box with a query in it; they
 *    just don't watch it being typed.
 *  - A single chained timeout, cleared on every effect teardown. An interval
 *    would keep firing after unmount and drift out of step with itself.
 */
export function useTypewriter(phrases: readonly string[], options: Options = {}) {
  const { enabled = true, typeMs = 68, deleteMs = 28, holdMs = 1900, loop = true } = options

  const first = phrases[0] ?? ''
  const [text, setText] = useState(enabled ? '' : first)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled || phrases.length === 0) {
      setText(first)
      return
    }

    let phrase = 0
    let chars = 0
    let deleting = false
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const current = phrases[phrase] ?? ''

      if (!deleting) {
        chars += 1
        setText(current.slice(0, chars))
        if (chars === current.length) {
          // One-shot mode simply stops here, leaving the finished phrase on
          // screen — nothing to erase, no timer left running.
          if (!loop) return
          deleting = true
          timer.current = window.setTimeout(tick, holdMs)
          return
        }
        timer.current = window.setTimeout(tick, typeMs)
        return
      }

      chars -= 1
      setText(current.slice(0, chars))
      if (chars === 0) {
        deleting = false
        phrase = (phrase + 1) % phrases.length
        timer.current = window.setTimeout(tick, 420)
        return
      }
      timer.current = window.setTimeout(tick, deleteMs)
    }

    timer.current = window.setTimeout(tick, 700)

    return () => {
      cancelled = true
      window.clearTimeout(timer.current)
    }
    // `phrases` is compared by identity: pass a module-level constant, never
    // an array literal, or every render restarts the typing from nothing.
  }, [phrases, enabled, first, typeMs, deleteMs, holdMs, loop])

  return text
}
