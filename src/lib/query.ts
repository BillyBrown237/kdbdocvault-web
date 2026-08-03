import { QueryClient } from '@tanstack/react-query'
import { get, set, del } from 'idb-keyval'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'

// Flaky-network defaults: cached reads stay usable offline (long gcTime),
// mutations are never auto-retried — apiFetch pairs every non-GET with an
// Idempotency-Key so the caller can retry explicitly and safely.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// IndexedDB persister (official TanStack recipe) — localStorage is too small
// for document metadata caches.
function createIDBPersister(key: IDBValidKey = 'kdbvault-query-cache'): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(key, client)
    },
    restoreClient: async () => await get<PersistedClient>(key),
    removeClient: async () => {
      await del(key)
    },
  }
}

export const queryPersister = createIDBPersister()
