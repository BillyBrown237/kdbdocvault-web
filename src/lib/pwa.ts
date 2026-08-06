import { useSyncExternalStore } from 'react'

// --- online/offline ----------------------------------------------------------

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** Reactive navigator.onLine. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
}

// --- install prompt ----------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// The browser fires beforeinstallprompt once, early — often before React
// mounts. Captured at module scope (imported from main.tsx) so the app shell
// can offer "Install app" whenever the browser considers us installable.
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // keep the mini-infobar away; we surface our own entry
  deferredPrompt = e as BeforeInstallPromptEvent
  notify()
})

window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  notify()
})

function subscribeInstall(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** True while the browser is offering installation and we hold the prompt. */
export function useInstallable(): boolean {
  return useSyncExternalStore(
    subscribeInstall,
    () => deferredPrompt !== null,
    () => false,
  )
}

/** Show the browser install dialog. Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const p = deferredPrompt
  await p.prompt()
  const choice = await p.userChoice
  deferredPrompt = null
  notify()
  return choice.outcome === 'accepted'
}
