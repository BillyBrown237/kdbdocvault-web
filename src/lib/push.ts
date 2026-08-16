import { registerDevice } from '@/lib/api/queries'

/**
 * W32 (B67) — browser push subscription.
 *
 * The whole PushSubscription object is what we send as the device `token`:
 * for web push a "token" is three values (endpoint, p256dh, auth), not one.
 * The backend stores that JSON verbatim in `devices.push_token` and parses it
 * at send time.
 */

/** Distinguishes the ways this can fail, so the UI can say something useful
 * instead of "something went wrong". */
export type PushOutcome =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'dismissed' | 'failed' }

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Already subscribed in THIS browser — the button should say so. */
export async function pushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    return (await reg.pushManager.getSubscription()) !== null
  } catch {
    return false
  }
}

export async function enablePush(vapidPublicKey: string): Promise<PushOutcome> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }

  // Permission must be requested from a user gesture, which is why this is
  // called from a click handler and never on mount.
  const permission = await Notification.requestPermission()
  if (permission === 'denied') return { ok: false, reason: 'denied' }
  if (permission !== 'granted') return { ok: false, reason: 'dismissed' }

  try {
    const reg = await navigator.serviceWorker.ready

    // Reuse an existing subscription rather than creating a second one — a
    // browser allows only one per registration, and re-subscribing with a
    // different key throws rather than replacing.
    const existing = await reg.pushManager.getSubscription()
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        // Required by Chrome: a subscription that can send silent pushes is
        // refused outright.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }))

    await registerDevice({ platform: 'web', token: JSON.stringify(sub) })
    return { ok: true }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    // Unsubscribing here only ends it in the browser; removing the device row
    // is a separate call, because the server may hold registrations for other
    // browsers this person uses.
    await sub?.unsubscribe()
  } catch {
    /* already gone */
  }
}

/**
 * applicationServerKey wants raw bytes; VAPID keys travel as base64url.
 *
 * Returns ArrayBuffer, not Uint8Array: since TS 5.7 the typed arrays are
 * generic over their buffer, and `Uint8Array<ArrayBufferLike>` no longer
 * satisfies `BufferSource` (it could be backed by a SharedArrayBuffer).
 * Handing over the buffer itself sidesteps the variance entirely.
 */
function urlBase64ToUint8Array(base64Url: string): ArrayBuffer {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}
