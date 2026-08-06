import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

import { getRouter } from './router'
import { queryClient, queryPersister } from './lib/query'
import { Toaster } from './components/ui/sonner'
import './i18n'
import './lib/pwa' // captures beforeinstallprompt before first render
import './styles.css'

const router = getRouter()

const rootElement = document.getElementById('app')!
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: 1000 * 60 * 60 * 24, // offline reads survive up to 24h
        }}
      >
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </PersistQueryClientProvider>
    </StrictMode>,
  )
}
