/*
 * B67/W32 — push handlers, imported into the generated service worker.
 *
 * vite-plugin-pwa uses the generateSW strategy, which produces the service
 * worker from config and would overwrite a hand-written one. `importScripts`
 * pulls this file into it instead, so precaching stays generated and push
 * stays hand-written. Switching to injectManifest to own the whole worker
 * would mean maintaining the precache logic by hand for the sake of twenty
 * lines.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    // A push with a non-JSON body is not ours. Showing "undefined" to a user
    // is worse than showing nothing.
    return
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'KDB DocVault', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // A shared tag collapses repeats: three reminders while the phone is in
      // a pocket should be one line in the shade, not three.
      tag: payload.tag ?? 'kdbvault',
      renotify: true,
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/'

  event.waitUntil(
    // Focus an existing window rather than opening another copy of the app —
    // a user who already has it open does not want a second one.
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate?.(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
