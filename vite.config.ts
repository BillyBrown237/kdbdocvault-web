import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Plain Vite SPA: static output for Caddy on the VPS — no SSR, no framework server.
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'KDB Vault',
        short_name: 'KDB Vault',
        description: 'Coffre-fort documentaire intelligent',
        lang: 'fr',
        display: 'standalone',
        start_url: '/',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell only. API calls are never intercepted — TanStack Query's
        // IndexedDB persistence handles offline data, not the service worker.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/v1\//, /^\/pub\//],
        // W32: push + notificationclick handlers. Imported rather than
        // hand-writing the whole worker (injectManifest), which would mean
        // maintaining the precache manifest by hand for twenty lines of push.
        importScripts: ['/push-sw.js'],
      },
    }),
  ],
  server: {
    port: 3000,
    // KdbVault.Api dev profile (launchSettings.json).
    // /pub is the alias for the UNVERSIONED public API surfaces (/sign,
    // /shared, /verify): same paths exist as SPA routes, so the alias avoids
    // the collision and is stripped before forwarding. Caddy mirrors this
    // with handle_path /pub/* in production.
    proxy: {
      '/v1': { target: 'http://localhost:5057' },
      '/pub': {
        target: 'http://localhost:5057',
        rewrite: (path) => path.replace(/^\/pub/, ''),
      },
    },
  },
})

export default config
