/**
 * Query/mutation definitions for W2 surfaces. queryOptions factories so routes
 * can preload (`context.queryClient.ensureQueryData`) and components can
 * `useQuery`/`useInfiniteQuery` the same definitions.
 */
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { apiFetch, publicApiFetch, setAccessToken, setCurrentTenantId } from './http'
import type {
  Document,
  DocumentVersion,
  Envelope,
  Folder,
  FolderContentItem,
  GuestSignView,
  LifecycleRule,
  Obligation,
  Page,
  Reminder,
  ReminderChannel,
  RuleType,
  Plan,
  SearchHit,
  ShareLink,
  SharedMeta,
  Tag,
  Tenant,
  TenantUsage,
  TrashItem,
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

// --- search / organization (W4) -----------------------------------------------------

export const searchQuery = (q: string) =>
  infiniteQueryOptions({
    queryKey: ['search', q],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<SearchHit>>(
        `/search${qs({ q, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
    enabled: q.trim().length > 0,
  })

export const tagsQuery = queryOptions({
  queryKey: ['tags'],
  queryFn: () => apiFetch<Page<Tag>>('/tags'),
})

export function createTag(name: string): Promise<Tag> {
  return apiFetch<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name }) })
}

export function setDocumentTags(documentId: string, tagIds: string[]): Promise<Page<Tag>> {
  return apiFetch<Page<Tag>>(`/documents/${documentId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tag_ids: tagIds }),
  })
}

export function moveDocument(documentId: string, folderId: string | null): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}/move`, {
    method: 'POST',
    body: JSON.stringify({ folder_id: folderId }),
  })
}

export function trashDocument(documentId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}`, { method: 'DELETE' })
}

export const trashQuery = infiniteQueryOptions({
  queryKey: ['trash'],
  queryFn: ({ pageParam }) =>
    apiFetch<Page<TrashItem>>(`/trash${qs({ cursor: pageParam || undefined, limit: PAGE_SIZE })}`),
  initialPageParam: '',
  getNextPageParam: (last) =>
    last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
})

export function restoreDocument(documentId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}/restore`, { method: 'POST' })
}

export function createFolder(name: string, parentId?: string): Promise<Folder> {
  return apiFetch<Folder>('/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parent_id: parentId }),
  })
}

// --- sharing (W5) --------------------------------------------------------------------

export const shareLinksQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['share-links', documentId],
    queryFn: () => apiFetch<Page<ShareLink>>(`/documents/${documentId}/share-links`),
  })

export function createShareLink(
  documentId: string,
  input: { permission: 'view' | 'download'; password?: string; expires_at?: string },
): Promise<ShareLink> {
  return apiFetch<ShareLink>(`/documents/${documentId}/share-links`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function revokeShareLink(linkId: string): Promise<void> {
  return apiFetch<void>(`/share-links/${linkId}`, { method: 'DELETE' })
}

// Public guest surface — unversioned, via the /pub alias (no auth).
export function resolveShared(token: string): Promise<SharedMeta> {
  return publicApiFetch<SharedMeta>(`/shared/${token}`)
}

export function unlockShared(token: string, password: string): Promise<{ access_token: string }> {
  return publicApiFetch<{ access_token: string }>(`/shared/${token}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function sharedContentBlob(token: string, unlockProof?: string): Promise<Blob> {
  const suffix = unlockProof ? `?unlock=${encodeURIComponent(unlockProof)}` : ''
  return publicApiFetch<Blob>(`/shared/${token}/content${suffix}`)
}

// --- signatures (W6) -----------------------------------------------------------------

export const envelopesForDocumentQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['envelopes', documentId],
    queryFn: () => apiFetch<Page<Envelope>>(`/envelopes${qs({ document_id: documentId })}`),
  })

export interface SignerInput {
  name: string
  email: string
  phone?: string
  signing_order: number
  verify_method: 'email_otp' | 'sms_otp' | 'id_check'
}

export function createEnvelope(
  documentId: string,
  input: { version_id: string; message?: string; deadline?: string; signers: SignerInput[] },
): Promise<Envelope> {
  return apiFetch<Envelope>(`/documents/${documentId}/envelopes`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function sendEnvelope(envelopeId: string): Promise<Envelope> {
  return apiFetch<Envelope>(`/envelopes/${envelopeId}/send`, { method: 'POST' })
}

export function remindEnvelope(envelopeId: string): Promise<void> {
  return apiFetch<void>(`/envelopes/${envelopeId}/remind`, { method: 'POST' })
}

export function cancelEnvelope(envelopeId: string, reason: string): Promise<void> {
  return apiFetch<void>(`/envelopes/${envelopeId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// Public guest-sign surface (via /pub, no auth).
export function guestSignView(token: string): Promise<GuestSignView> {
  return publicApiFetch<GuestSignView>(`/sign/${token}`)
}

export function guestRequestOtp(token: string): Promise<void> {
  return publicApiFetch<void>(`/sign/${token}/verify`, { method: 'POST' })
}

export function guestSubmitOtp(token: string, code: string): Promise<void> {
  return publicApiFetch<void>(`/sign/${token}/otp`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function guestSign(
  token: string,
  signature: { type: string; data: string },
  consent: boolean,
): Promise<void> {
  return publicApiFetch<void>(`/sign/${token}/complete`, {
    method: 'POST',
    body: JSON.stringify({ signature, consent }),
  })
}

export function guestDecline(token: string, reason: string): Promise<void> {
  return publicApiFetch<void>(`/sign/${token}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// --- account / auth (W7) -------------------------------------------------------------

export interface Session {
  id: string
  device: string
  ip: string
  created_at: string
  last_active_at: string
  current: boolean
}

export const sessionsQuery = queryOptions({
  queryKey: ['sessions'],
  queryFn: () => apiFetch<Page<Session>>('/auth/sessions'),
})

export function revokeSession(sessionId: string): Promise<void> {
  return apiFetch<void>(`/auth/sessions/${sessionId}`, { method: 'DELETE' })
}

export function updateProfile(input: { name?: string; locale?: string; phone?: string }): Promise<void> {
  return apiFetch<void>('/me', { method: 'PATCH', body: JSON.stringify(input) })
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch<void>('/me/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

export function totpSetup(): Promise<{ secret: string; otpauth_uri: string }> {
  return apiFetch<{ secret: string; otpauth_uri: string }>('/auth/mfa/totp/setup', {
    method: 'POST',
  })
}

export function totpConfirm(code: string): Promise<void> {
  return apiFetch<void>('/auth/mfa/totp/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function totpDisable(password: string, code: string): Promise<void> {
  return apiFetch<void>('/auth/mfa/totp', {
    method: 'DELETE',
    body: JSON.stringify({ password, code }),
  })
}

// Public password-reset surface.
export function forgotPassword(identifier: string): Promise<void> {
  return apiFetch<void>('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  })
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch<void>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  })
}

// --- lifecycle (W8) ------------------------------------------------------------------

export const expiringQuery = (withinDays = 90) =>
  infiniteQueryOptions({
    queryKey: ['expiring', withinDays],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<LifecycleRule>>(
        `/lifecycle/expiring${qs({ within_days: withinDays, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

export const lifecycleRulesQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['lifecycle-rules', documentId],
    queryFn: () => apiFetch<Page<LifecycleRule>>(`/documents/${documentId}/lifecycle-rules`),
  })

export function createLifecycleRule(
  documentId: string,
  input: { rule_type: RuleType; key_date: string },
): Promise<LifecycleRule> {
  return apiFetch<LifecycleRule>(`/documents/${documentId}/lifecycle-rules`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteLifecycleRule(ruleId: string): Promise<void> {
  return apiFetch<void>(`/lifecycle-rules/${ruleId}`, { method: 'DELETE' })
}

export function confirmLifecycleRule(ruleId: string): Promise<LifecycleRule> {
  return apiFetch<LifecycleRule>(`/lifecycle-rules/${ruleId}/confirm`, { method: 'POST' })
}

export const remindersQuery = (ruleId: string) =>
  queryOptions({
    queryKey: ['reminders', ruleId],
    queryFn: () => apiFetch<Page<Reminder>>(`/lifecycle-rules/${ruleId}/reminders`),
  })

export function createReminder(
  ruleId: string,
  input: { offset_days: number; channel: ReminderChannel; recipient_id?: string },
): Promise<Reminder> {
  return apiFetch<Reminder>(`/lifecycle-rules/${ruleId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteReminder(reminderId: string): Promise<void> {
  return apiFetch<void>(`/reminders/${reminderId}`, { method: 'DELETE' })
}

export const obligationsQuery = (status?: 'open' | 'done' | 'overdue') =>
  infiniteQueryOptions({
    queryKey: ['obligations', status ?? 'all'],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<Obligation>>(
        `/obligations${qs({ status, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

export function createObligation(input: {
  document_id: string
  title: string
  due_date: string
}): Promise<Obligation> {
  return apiFetch<Obligation>('/obligations', { method: 'POST', body: JSON.stringify(input) })
}

export function updateObligation(
  obligationId: string,
  input: { status?: string; due_date?: string },
): Promise<Obligation> {
  return apiFetch<Obligation>(`/obligations/${obligationId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
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
