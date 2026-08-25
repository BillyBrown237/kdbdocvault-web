import { useEffect, useState } from 'react'

/**
 * Sidebar collapsed state, remembered across sessions.
 *
 * localStorage rather than a server preference: this is a per-DEVICE choice.
 * Someone who collapses the rail on a 13" laptop does not want it collapsed on
 * the 27" monitor they dock into, and syncing it would guarantee exactly that.
 *
 * The initial value is read synchronously in the useState initialiser, not in
 * an effect — an effect would paint the expanded sidebar first and snap it
 * shut on the next frame, which reads as a bug every single page load.
 */

const KEY = 'kdb.sidebar.collapsed'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    // Private browsing, or storage disabled by policy. An unremembered
    // preference is a much smaller problem than a shell that will not render.
    return false
  }
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, collapsed ? '1' : '0')
    } catch {
      /* see above */
    }
  }, [collapsed])

  // ⌘B / Ctrl+B — the shortcut every editor and every IDE already uses for
  // this, so nobody has to learn ours.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'b' || !(e.metaKey || e.ctrlKey)) return
      // Never steal the keystroke from a field — in a text input ⌘B is bold.
      const el = document.activeElement
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      )
        return
      e.preventDefault()
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { collapsed, setCollapsed, toggle: () => setCollapsed((c) => !c) }
}
