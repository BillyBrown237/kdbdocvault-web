/**
 * Query/mutation definitions for W2 surfaces. queryOptions factories so routes
 * can preload (`context.queryClient.ensureQueryData`) and components can
 * `useQuery`/`useInfiniteQuery` the same definitions.
 */
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { apiFetch, setAccessToken, setCurrentTenantId } from './http'
import type {
  Document,
  DocumentVersion,
  Folder,
  FolderContentItem,
  Page,
  Plan,
  Tenant,
  TenantUsage,
  User,
} from './types'
import type { QueryClient } from '@tanstack/react-query'

const PAGE_SIZE = 30

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

// --- profile & tenant ---------------------------------------------------------

export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: () => apiFetch<User>('/me'),
  staleTime: 5 * 60_000,
})

export const tenantQuery = queryOptions({
  queryKey: ['tenant'],
  queryFn: () => apiFetch<Tenant>('/tenant'),
  staleTime: 5 * 60_000,
})

export const tenantUsageQuery = queryOptions({
  queryKey: ['tenant', 'usage'],
  queryFn: () => apiFetch<TenantUsage>('/tenant/usage'),
})

/**
 * Switch tenant = new token scope. Everything cached belongs to the old
 * tenant, so wipe the cache (memory + IndexedDB persistence follows suit).
 */
export async function switchTenant(queryClient: QueryClient, tenantId: string): Promise<void> {
  const tokens = await apiFetch<{ access_token?: string; tenant_id?: string | null }>(
    '/auth/switch-tenant',
    {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    },
  )
  setAccessToken(tokens.access_token ?? null)
  setCurrentTenantId(tokens.tenant_id ?? tenantId)
  queryClient.clear()
}

// --- onboarding -----------------------------------------------------------------

export const plansQuery = queryOptions({
  queryKey: ['plans'],
  queryFn: () => apiFetch<Page<Plan>>('/plans'),
  staleTime: 60 * 60_000,
})

export async function createTenant(input: {
  name: string
  plan: string
  region: string
}): Promise<Tenant> {
  return apiFetch<Tenant>('/tenants', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// --- vault browsing -------------------------------------------------------------

export const rootFoldersQuery = infiniteQueryOptions({
  queryKey: ['folders', 'root'],
  queryFn: ({ pageParam }) =>
    apiFetch<Page<Folder>>(`/folders${qs({ cursor: pageParam || undefined, limit: PAGE_SIZE })}`),
  initialPageParam: '',
  getNextPageParam: (last) =>
    last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
})

export const folderQuery = (folderId: string) =>
  queryOptions({
    queryKey: ['folders', folderId],
    queryFn: () => apiFetch<Folder>(`/folders/${folderId}`),
  })

export const folderContentsQuery = (folderId: string) =>
  infiniteQueryOptions({
    queryKey: ['folders', folderId, 'contents'],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<FolderContentItem>>(
        `/folders/${folderId}/contents${qs({ cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

export const documentsQuery = (filters: { folder_id?: string; q?: string } = {}) =>
  infiniteQueryOptions({
    queryKey: ['documents', filters],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<Document>>(
        `/documents${qs({ ...filters, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

// --- document detail --------------------------------------------------------------

export const documentQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['documents', 'detail', documentId],
    queryFn: () => apiFetch<Document>(`/documents/${documentId}`),
  })

export const documentVersionsQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['documents', 'detail', documentId, 'versions'],
    queryFn: () => apiFetch<Page<DocumentVersion>>(`/documents/${documentId}/versions`),
  })

/** Follows the 302 to the signed URL and returns the bytes. */
export function downloadDocumentBlob(documentId: string): Promise<Blob> {
  return apiFetch<Blob>(`/documents/${documentId}/download?disposition=inline`)
}

export function addFavorite(documentId: string): Promise<void> {
  return apiFetch<void>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ document_id: documentId }),
  })
}

export function removeFavorite(documentId: string): Promise<void> {
  return apiFetch<void>(`/favorites/${documentId}`, { method: 'DELETE' })
}

// --- dashboard -------------------------------------------------------------------

export const recentQuery = queryOptions({
  queryKey: ['recent'],
  queryFn: () => apiFetch<Page<Document>>(`/recent${qs({ limit: 10 })}`),
})

export const favoritesQuery = queryOptions({
  queryKey: ['favorites'],
  queryFn: () => apiFetch<Page<Document>>(`/favorites${qs({ limit: 10 })}`),
})
