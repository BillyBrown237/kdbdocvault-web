import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Marketing site build.
 *
 * No PWA plugin, no router plugin, no API proxy — this app talks to nothing.
 * Every dependency it doesn't have is a dependency a first-time visitor
 * doesn't download.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Marketing pages are read once and shared; a smaller warning ceiling
    // than the app's keeps the bundle honest as sections get added.
    chunkSizeWarningLimit: 300,
    rolldownOptions: {
      output: {
        // Renamed from `advancedChunks` in Rolldown; the old name still works
        // but warns on every build.
        codeSplitting: {
          groups: [
            // React barely changes; our sections change every week. Splitting
            // them keeps the framework cached across deploys, and it keeps the
            // size warning above pointed at code we actually wrote.
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 3100,
  },
})
