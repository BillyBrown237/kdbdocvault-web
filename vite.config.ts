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
        navigateFallbackDenylist: [/^\/v1\//],
      },
    }),
  ],
  server: {
    port: 3000,
    // KdbVault.Api dev profile (launchSettings.json)
    proxy: { '/v1': { target: 'http://localhost:5057' } },
  },
})

export default config
