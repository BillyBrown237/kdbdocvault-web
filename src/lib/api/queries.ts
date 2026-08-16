/**
 * Query/mutation definitions for W2 surfaces. queryOptions factories so routes
 * can preload (`context.queryClient.ensureQueryData`) and components can
 * `useQuery`/`useInfiniteQuery` the same definitions.
 */
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  API_V1,
  ApiProblem,
  apiFetch,
  apiFetchWithEtag,
  publicApiFetch,
  setAccessToken,
  setCurrentTenantId,
} from './http'
import type {
  AclEntry,
  AclEntryInput,
  AuditAnchor,
  AuditEvent,
  CreateImportConnectionResult,
  DriveBrowse,
  Extraction,
  ImportConnection,
  ImportJob,
  LegalHold,
  ReportOverview,
  ExpiringReportRow,
  ActivityMember,
  SharingExposureReport,
  ComplianceReport,
  WorkflowPerfReport,
  Job,
  DataRoom,
  DataRoomDetail,
  Department,
  Document,
  DocumentType,
  EffectiveAccess,
  SavedSearch,
  SignatureEvidence,
  Signer,
  Notification,
  RoomPortalView,
  RoomVisitorAnalytics,
  DocumentVersion,
  Envelope,
  Invitation,
  Member,
  PublicVerifyResult,
  Role,
  Folder,
  FolderContentItem,
  GuestSignView,
  Invoice,
  LifecycleRule,
  Obligation,
  Page,
  Payment,
  Reminder,
  ReminderChannel,
  RuleType,
  Plan,
  SearchHit,
  ShareLink,
  SharedMeta,
  Subscription,
  Tag,
  TaskItem,
  Tenant,
  TenantUsage,
  TrashItem,
  User,
  Workflow,
  WorkflowStep,
  WorkflowTemplate,
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

// /plans is mapped on the PUBLIC (unversioned) surface — MapPublicEndpoints,
// not the /v1 group — so it goes through publicApiFetch (the /pub alias),
// not apiFetch. Same for onboarding, which reads it before any tenant exists.
export const plansQuery = queryOptions({
  queryKey: ['plans'],
  queryFn: () => publicApiFetch<Page<Plan>>('/plans'),
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

/** The facets the backend accepts alongside `q` — and exactly the shape a
 * saved search stores, which is why it's exported. */
export interface SearchFilters {
  type_id?: string
  folder_id?: string
  tag?: string
}

export const searchQuery = (q: string, filters: SearchFilters = {}) =>
  infiniteQueryOptions({
    queryKey: ['search', q, filters],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<SearchHit>>(
        `/search${qs({ q, ...filters, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
    enabled: q.trim().length > 0,
  })

// Saved searches live under /search/queries — a sub-resource of search, not a
// top-level /queries collection.

export const savedSearchesQuery = queryOptions({
  queryKey: ['saved-searches'],
  queryFn: () => apiFetch<{ data: SavedSearch[] }>('/search/queries'),
})

export function saveSearch(name: string, query: SearchFilters & { q: string }): Promise<SavedSearch> {
  return apiFetch<SavedSearch>('/search/queries', {
    method: 'POST',
    body: JSON.stringify({ name, query }),
  })
}

export function deleteSavedSearch(queryId: string): Promise<void> {
  return apiFetch<void>(`/search/queries/${queryId}`, { method: 'DELETE' })
}

/** Runs the stored criteria server-side — the client never re-derives them. */
export const runSavedSearchQuery = (queryId: string) =>
  infiniteQueryOptions({
    queryKey: ['saved-search-run', queryId],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<SearchHit>>(
        `/search/queries/${queryId}${qs({ cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

// --- pins & document types --------------------------------------------------------

export const pinsQuery = queryOptions({
  queryKey: ['pins'],
  queryFn: () => apiFetch<Page<Document>>('/pins'),
})

export function pinDocument(documentId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}/pin`, { method: 'POST' })
}

export function unpinDocument(documentId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}/pin`, { method: 'DELETE' })
}

export const documentTypesQuery = queryOptions({
  queryKey: ['document-types'],
  queryFn: () => apiFetch<Page<DocumentType>>('/document-types'),
})

// B55: types became editable. System types (is_system) reject both calls with
// a 422 — the UI hides the buttons rather than letting the user find out.
export function updateDocumentType(
  typeId: string,
  input: { name?: string; metadata_schema?: Record<string, unknown> },
): Promise<DocumentType> {
  return apiFetch<DocumentType>(`/document-types/${typeId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteDocumentType(typeId: string): Promise<void> {
  return apiFetch<void>(`/document-types/${typeId}`, { method: 'DELETE' })
}

// B58: typed links. Stored once, returned from both ends with a computed
// `direction` — 'outgoing' means THIS document is the subject of the verb.
export function documentLinksQuery(documentId: string) {
  return queryOptions({
    queryKey: ['documents', 'links', documentId],
    queryFn: () => apiFetch<Page<DocumentLink>>(`/documents/${documentId}/links`),
  })
}

/** A small, non-infinite search for pickers (link target, and anywhere else a
 * few matches beat a paginated result set). */
export function documentPickerQuery(term: string) {
  return queryOptions({
    queryKey: ['document-picker', term],
    queryFn: () => apiFetch<Page<SearchHit>>(`/search${qs({ q: term, limit: 5 })}`),
  })
}

export function createDocumentLink(
  documentId: string,
  input: { target_id: string; link_type: string },
): Promise<DocumentLink> {
  return apiFetch<DocumentLink>(`/documents/${documentId}/links`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteDocumentLink(documentId: string, linkId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}/links/${linkId}`, { method: 'DELETE' })
}

export function createDocumentType(
  name: string,
  metadataSchema: Record<string, unknown> = {},
): Promise<DocumentType> {
  return apiFetch<DocumentType>('/document-types', {
    method: 'POST',
    body: JSON.stringify({ name, metadata_schema: metadataSchema }),
  })
}

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

/** Correcting a typo'd address before the signer has acted. */
export function updateSigner(
  envelopeId: string,
  signerId: string,
  input: { email?: string; phone?: string },
): Promise<Signer> {
  return apiFetch<Signer>(`/envelopes/${envelopeId}/signers/${signerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export const evidenceQuery = (envelopeId: string) =>
  queryOptions({
    queryKey: ['evidence', envelopeId],
    queryFn: () => apiFetch<SignatureEvidence>(`/envelopes/${envelopeId}/evidence`),
  })

/**
 * Both of these answer a 302 to a short-lived presigned URL. They must go
 * through `apiFetch` (which carries the bearer token and follows the redirect
 * into a blob) — a bare `<a href>` navigation sends no Authorization header,
 * since the access token lives in memory only, and would just 401.
 */
export function sealedDocumentBlob(envelopeId: string): Promise<Blob> {
  return apiFetch<Blob>(`/envelopes/${envelopeId}/signed-document`)
}

export function signerIdDocumentBlob(envelopeId: string, signerId: string): Promise<Blob> {
  return apiFetch<Blob>(`/envelopes/${envelopeId}/signers/${signerId}/id-document`)
}

export function reviewSignerId(
  envelopeId: string,
  signerId: string,
  approve: boolean,
  reason?: string,
): Promise<void> {
  return apiFetch<void>(`/envelopes/${envelopeId}/signers/${signerId}/id-review`, {
    method: 'POST',
    body: JSON.stringify({ approve, reason }),
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
    // B49: the contract says PATCH (backend accepts both during transition).
    method: 'PATCH',
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

// --- billing (W9) --------------------------------------------------------------------

/** No subscription = trial, and the backend says so with a 404. That's a
 * legitimate state, not an error — map it to null so the UI can render the
 * trial copy without an error path. */
export const subscriptionQuery = queryOptions({
  queryKey: ['subscription'],
  queryFn: async (): Promise<Subscription | null> => {
    try {
      return await apiFetch<Subscription>('/subscription')
    } catch (err) {
      if (err instanceof ApiProblem && err.status === 404) return null
      throw err
    }
  },
  retry: false,
})

export const invoicesQuery = infiniteQueryOptions({
  queryKey: ['invoices'],
  queryFn: ({ pageParam }) =>
    apiFetch<Page<Invoice>>(`/invoices${qs({ cursor: pageParam || undefined, limit: PAGE_SIZE })}`),
  initialPageParam: '',
  getNextPageParam: (last) =>
    last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
})

export function changeSubscription(
  planId: string,
  opts: { preview?: boolean; seats?: number } = {},
): Promise<{ subscription: Subscription; amount_due_minor_units: number; applied: boolean }> {
  return apiFetch(`/subscription/change${qs({ preview: opts.preview ? 'true' : undefined })}`, {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, seats: opts.seats }),
  })
}

export function initiateMobileMoney(input: {
  provider: 'mtn_momo' | 'orange_money'
  phone: string
  plan_id: string
}): Promise<Payment> {
  return apiFetch<Payment>('/payments/mobile-money/initiate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getPayment(paymentId: string): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${paymentId}`)
}

export function invoicePdfUrl(invoiceId: string): string {
  return `${API_V1}/invoices/${invoiceId}/pdf`
}

// --- team & admin (W10) --------------------------------------------------------------

export const membersQuery = queryOptions({
  queryKey: ['members'],
  queryFn: () => apiFetch<Page<Member>>('/members'),
})

export const invitationsQuery = queryOptions({
  queryKey: ['invitations'],
  queryFn: () => apiFetch<Page<Invitation>>('/invitations'),
})

export const rolesQuery = queryOptions({
  queryKey: ['roles'],
  queryFn: () => apiFetch<Page<Role>>('/roles'),
})

export const departmentsQuery = queryOptions({
  queryKey: ['departments'],
  queryFn: () => apiFetch<Page<Department>>('/departments'),
})

export function createDepartment(input: { name: string; parent_id?: string }): Promise<Department> {
  return apiFetch<Department>('/departments', { method: 'POST', body: JSON.stringify(input) })
}

// B55: departments were create-only until now. `parent_id: null` promotes to
// the top level; omitting the key leaves the parent alone.
export function updateDepartment(
  departmentId: string,
  input: { name?: string; parent_id?: string | null },
): Promise<Department> {
  return apiFetch<Department>(`/departments/${departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteDepartment(departmentId: string): Promise<void> {
  return apiFetch<void>(`/departments/${departmentId}`, { method: 'DELETE' })
}

// --- B57 security policy (read admin+, write owner) ---------------------------

export const securityPolicyQuery = queryOptions({
  queryKey: ['security-policy'],
  queryFn: () => apiFetch<SecurityPolicy>('/tenant/security-policy'),
})

export function setSecurityPolicy(input: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  return apiFetch<SecurityPolicy>('/tenant/security-policy', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// --- B56 notification preferences --------------------------------------------

export const notificationPrefsQuery = queryOptions({
  queryKey: ['notification-preferences'],
  queryFn: () => apiFetch<NotificationPrefs>('/me/notification-preferences'),
})

export function setNotificationPrefs(
  preferences: { family: string; channels: Record<string, boolean> }[],
): Promise<void> {
  return apiFetch<void>('/me/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  })
}

export function createInvitation(input: {
  email: string
  role_id: string
}): Promise<{ invitation: Invitation; invite_url: string }> {
  return apiFetch('/invitations', { method: 'POST', body: JSON.stringify(input) })
}

export function revokeInvitation(invitationId: string): Promise<void> {
  return apiFetch<void>(`/invitations/${invitationId}`, { method: 'DELETE' })
}

export function updateMember(
  memberId: string,
  input: { role_id?: string; status?: string },
): Promise<Member> {
  return apiFetch<Member>(`/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

/**
 * Moves the outgoing owner's documents to another member and hands over the
 * Owner role. Answers 202 with a job shape, but the work is already done
 * (`documents_moved` is final) — there's nothing to poll.
 */
export function transferOwnership(
  memberId: string,
  toMemberId: string,
): Promise<{ job_id: string; status: string; documents_moved: number }> {
  return apiFetch(`/members/${memberId}/transfer-ownership`, {
    method: 'POST',
    body: JSON.stringify({ to_member_id: toMemberId }),
  })
}

export function removeMember(memberId: string): Promise<void> {
  return apiFetch<void>(`/members/${memberId}`, { method: 'DELETE' })
}

export function updateTenantName(name: string): Promise<Tenant> {
  return apiFetch<Tenant>('/tenant', { method: 'PATCH', body: JSON.stringify({ name }) })
}

export const auditEventsQuery = (filters: { action?: string; resource_type?: string } = {}) =>
  infiniteQueryOptions({
    queryKey: ['audit', filters],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<AuditEvent>>(
        `/audit/events${qs({ ...filters, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

// Public: invitation accept + document verification (unversioned surfaces).
export function acceptInvitation(
  token: string,
  input: { name?: string; password?: string },
): Promise<{ access_token?: string; tenant_id?: string | null }> {
  return publicApiFetch(`/invitations/${token}/accept`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function verifyDocumentHash(hash: string): Promise<PublicVerifyResult> {
  return publicApiFetch<PublicVerifyResult>(`/verify/${hash}`)
}

// --- workflows & tasks (W11) ------------------------------------------------------

export const workflowTemplatesQuery = queryOptions({
  queryKey: ['workflow-templates'],
  queryFn: () => apiFetch<Page<WorkflowTemplate>>('/workflow-templates'),
})

export const workflowInboxQuery = queryOptions({
  queryKey: ['workflow-inbox'],
  queryFn: () => apiFetch<Page<WorkflowStep>>('/workflow-steps/inbox'),
})

export const workflowsForDocumentQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['workflows', documentId],
    queryFn: () => apiFetch<Page<Workflow>>(`/workflows${qs({ document_id: documentId })}`),
  })

export function startWorkflow(documentId: string, templateId: string, note?: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/documents/${documentId}/workflows`, {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId, note }),
  })
}

export function cancelWorkflow(workflowId: string, reason: string): Promise<void> {
  return apiFetch<void>(`/workflows/${workflowId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function decideStep(
  stepId: string,
  decision: 'approve' | 'reject' | 'request_changes',
  comment?: string,
): Promise<void> {
  return apiFetch<void>(`/workflow-steps/${stepId}/decide`, {
    method: 'POST',
    body: JSON.stringify({ decision, comment }),
  })
}

/** Hands the step to another member — the trail keeps `delegated_from`. */
export function delegateStep(
  stepId: string,
  toMemberId: string,
  reason?: string,
): Promise<WorkflowStep> {
  return apiFetch<WorkflowStep>(`/workflow-steps/${stepId}/delegate`, {
    method: 'POST',
    body: JSON.stringify({ to_member_id: toMemberId, reason }),
  })
}

export function remindStep(stepId: string): Promise<void> {
  return apiFetch<void>(`/workflow-steps/${stepId}/remind`, { method: 'POST' })
}

export const tasksQuery = (status?: 'open' | 'done') =>
  infiniteQueryOptions({
    queryKey: ['tasks', status ?? 'all'],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<TaskItem>>(
        `/tasks${qs({ status, cursor: pageParam || undefined, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

export function createTask(input: {
  title: string
  document_id?: string
  due_at?: string
}): Promise<TaskItem> {
  return apiFetch<TaskItem>('/tasks', { method: 'POST', body: JSON.stringify(input) })
}

export function updateTask(taskId: string, input: { status?: string }): Promise<TaskItem> {
  return apiFetch<TaskItem>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

// --- data rooms & ACLs (W12) -----------------------------------------------------

export const dataRoomsQuery = queryOptions({
  queryKey: ['data-rooms'],
  queryFn: () => apiFetch<Page<DataRoom>>('/data-rooms'),
})

export const dataRoomQuery = (roomId: string) =>
  queryOptions({
    queryKey: ['data-room', roomId],
    queryFn: () => apiFetch<DataRoomDetail>(`/data-rooms/${roomId}`),
  })

export const roomAnalyticsQuery = (roomId: string) =>
  queryOptions({
    queryKey: ['room-analytics', roomId],
    queryFn: () =>
      apiFetch<{ visitors: RoomVisitorAnalytics[] }>(`/data-rooms/${roomId}/analytics`),
  })

export function createDataRoom(input: {
  name: string
  description?: string
  expires_at?: string
}): Promise<DataRoom> {
  return apiFetch<DataRoom>('/data-rooms', { method: 'POST', body: JSON.stringify(input) })
}

export function updateDataRoom(
  roomId: string,
  input: { name?: string; expires_at?: string | null },
): Promise<DataRoom> {
  return apiFetch<DataRoom>(`/data-rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

/** DELETE closes the room (soft) — the audit trail and analytics survive. */
export function closeDataRoom(roomId: string): Promise<void> {
  return apiFetch<void>(`/data-rooms/${roomId}`, { method: 'DELETE' })
}

export function addRoomDocuments(roomId: string, documentIds: string[]): Promise<void> {
  return apiFetch<void>(`/data-rooms/${roomId}/documents`, {
    method: 'POST',
    body: JSON.stringify({ document_ids: documentIds }),
  })
}

/** The visitor's magic link is emailed, never returned — see CHANGES W12. */
export function inviteRoomVisitor(
  roomId: string,
  input: { email: string; name?: string },
): Promise<{ status: string }> {
  return apiFetch(`/data-rooms/${roomId}/visitors`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export const aclQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['acl', documentId],
    queryFn: () => apiFetch<{ entries: AclEntry[] }>(`/documents/${documentId}/acl`),
  })

/** PUT replaces the WHOLE set — send every entry that should survive. */
export function setAcl(documentId: string, entries: AclEntryInput[]): Promise<{ entries: AclEntry[] }> {
  return apiFetch(`/documents/${documentId}/acl`, {
    method: 'PUT',
    body: JSON.stringify({ entries }),
  })
}

export const effectiveAccessQuery = (documentId: string, memberId: string) =>
  queryOptions({
    queryKey: ['effective-access', documentId, memberId],
    queryFn: () =>
      apiFetch<EffectiveAccess>(
        `/documents/${documentId}/effective-access${qs({ member_id: memberId })}`,
      ),
  })

// --- room portal (PUBLIC, unversioned — same reasoning as /shared) ----------------

export function resolveRoom(token: string): Promise<RoomPortalView> {
  return publicApiFetch<RoomPortalView>(`/room/${token}`)
}

export function roomContentBlob(token: string, documentId: string): Promise<Blob> {
  return publicApiFetch<Blob>(`/room/${token}/documents/${documentId}/content`)
}

/** Fire-and-forget engagement ping; the backend clamps seconds to 1–120. */
export function roomHeartbeat(token: string, seconds: number): Promise<void> {
  return publicApiFetch<void>(`/room/${token}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ seconds }),
  })
}

// --- notifications (W13) ----------------------------------------------------------

export const notificationsQuery = (unread?: boolean) =>
  infiniteQueryOptions({
    queryKey: ['notifications', unread ?? 'all'],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<Notification>>(
        `/notifications${qs({
          unread: unread ? 'true' : undefined,
          cursor: pageParam || undefined,
          limit: 25,
        })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

/** Per-channel delivery outcome (in-app / email / SMS) for one notification. */
export const notificationDeliveryQuery = (notificationId: string) =>
  queryOptions({
    queryKey: ['notification-delivery', notificationId],
    queryFn: () =>
      apiFetch<{ channels: { channel: string; status: string; at: string | null }[] }>(
        `/notifications/${notificationId}/delivery`,
      ),
  })

export function markNotificationsRead(input: { ids?: string[]; all?: boolean }): Promise<void> {
  return apiFetch<void>('/notifications/read', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// --- extractions, jobs, document trail (W14) --------------------------------------

export const extractionsQuery = (documentId: string) =>
  queryOptions({
    queryKey: ['extractions', documentId],
    queryFn: () => apiFetch<{ data: Extraction[] }>(`/documents/${documentId}/extractions`),
  })

/** `corrected_value` omitted = "the machine was right". Supplying it both fixes
 * the value and, for expiry_date, retires the suggestion at the old date. */
export function confirmExtraction(
  documentId: string,
  extractionId: string,
  correctedValue?: string,
): Promise<Extraction> {
  return apiFetch<Extraction>(
    `/documents/${documentId}/extractions/${extractionId}/confirm`,
    { method: 'POST', body: JSON.stringify({ corrected_value: correctedValue }) },
  )
}

/** Re-runs OCR + extraction on the current version. The document IS the job. */
export function reprocessDocument(documentId: string): Promise<Job> {
  return apiFetch<Job>(`/documents/${documentId}/reprocess`, { method: 'POST' })
}

export const documentAuditQuery = (documentId: string) =>
  infiniteQueryOptions({
    queryKey: ['document-audit', documentId],
    queryFn: ({ pageParam }) =>
      apiFetch<Page<AuditEvent>>(
        `/documents/${documentId}/audit${qs({ cursor: pageParam || undefined, limit: 25 })}`,
      ),
    initialPageParam: '',
    getNextPageParam: (last) =>
      last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
  })

export function createEvidenceBundle(documentId: string): Promise<Job> {
  return apiFetch<Job>(`/documents/${documentId}/evidence-bundle`, { method: 'POST' })
}

export function createAuditExport(
  format: string,
  filters?: Record<string, string>,
): Promise<Job> {
  return apiFetch<Job>('/audit/exports', {
    method: 'POST',
    body: JSON.stringify({ format, filters }),
  })
}

/** B52/W25 — §19 exit guarantee. Owner-only; the backend returns the
 * EXISTING job if one is already queued/running, so double-clicks are safe. */
export function createTenantExport(): Promise<Job> {
  return apiFetch<Job>('/tenant/export', { method: 'POST' })
}

export const jobQuery = (jobId: string) =>
  queryOptions({
    queryKey: ['job', jobId],
    queryFn: () => apiFetch<Job>(`/audit/exports/${jobId}`),
  })

export const auditAnchorsQuery = infiniteQueryOptions({
  queryKey: ['audit-anchors'],
  queryFn: ({ pageParam }) =>
    apiFetch<Page<AuditAnchor>>(`/audit/anchors${qs({ cursor: pageParam || undefined, limit: 25 })}`),
  initialPageParam: '',
  getNextPageParam: (last) =>
    last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
})

// --- imports (W17) ----------------------------------------------------------------

export const importsQuery = infiniteQueryOptions({
  queryKey: ['imports'],
  queryFn: ({ pageParam }) =>
    apiFetch<Page<ImportJob>>(`/imports${qs({ cursor: pageParam || undefined, limit: 25 })}`),
  initialPageParam: '',
  getNextPageParam: (last) =>
    last.pagination?.has_more ? (last.pagination.next_cursor ?? undefined) : undefined,
})

export const importQuery = (importId: string) =>
  queryOptions({
    queryKey: ['import', importId],
    queryFn: () => apiFetch<ImportJob>(`/imports/${importId}`),
  })

/** `upload_id` is a RESERVED (not completed) archive upload — see UploadTask. */
export function startImport(input: {
  upload_id: string
  target_folder_id?: string
  source?: 'zip' | 'csv'
  mapping?: Record<string, string>
  run_pipeline?: boolean
}): Promise<ImportJob> {
  return apiFetch<ImportJob>('/imports', { method: 'POST', body: JSON.stringify(input) })
}

export function cancelImport(importId: string): Promise<void> {
  return apiFetch<void>(`/imports/${importId}/cancel`, { method: 'POST' })
}

export const importConnectionsQuery = queryOptions({
  queryKey: ['import-connections'],
  queryFn: () => apiFetch<{ data: ImportConnection[] }>('/import-connections'),
})

// --- editing (W24 / B48) ----------------------------------------------------------

/** Fresh document + its ETag — the token PATCH must echo as If-Match. */
export function getDocumentWithEtag(
  documentId: string,
): Promise<{ data: Document; etag: string | null }> {
  return apiFetchWithEtag<Document>(`/documents/${documentId}`)
}

export function patchDocument(
  documentId: string,
  etag: string,
  // B54: `status` accepts draft | active | archived only. The expiry states
  // (expiring/expired/renewed) are derived from lifecycle rules by a worker
  // and the API rejects them with a 422 explaining why.
  input: {
    title?: string
    type_id?: string | null
    folder_id?: string | null
    status?: 'draft' | 'active' | 'archived'
  },
): Promise<Document> {
  return apiFetch<Document>(`/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'If-Match': etag },
    body: JSON.stringify(input),
  })
}

export function renameFolder(folderId: string, name: string): Promise<void> {
  return apiFetch<void>(`/folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function moveFolder(folderId: string, parentId: string | null): Promise<void> {
  return apiFetch<void>(`/folders/${folderId}/move`, {
    method: 'POST',
    body: JSON.stringify({ parent_id: parentId }),
  })
}

export function deleteFolder(folderId: string): Promise<void> {
  return apiFetch<void>(`/folders/${folderId}`, { method: 'DELETE' })
}

/** Authenticated 302 → presigned URL → bytes (the W16 rule: fetch, never link). */
export function downloadVersionBlob(documentId: string, versionId: string): Promise<Blob> {
  return apiFetch<Blob>(`/documents/${documentId}/versions/${versionId}/download`)
}

export function restoreVersion(
  documentId: string,
  versionId: string,
): Promise<{ version_id: string; version_no: number }> {
  return apiFetch<{ version_id: string; version_no: number }>(
    `/documents/${documentId}/versions/${versionId}/restore`,
    { method: 'POST' },
  )
}

// --- reports (W20 / B46, admin+) --------------------------------------------------

export const reportOverviewQuery = queryOptions({
  queryKey: ['reports', 'overview'],
  queryFn: () => apiFetch<ReportOverview>('/reports/overview'),
})

export const reportExpiringQuery = (withinDays: number) =>
  queryOptions({
    queryKey: ['reports', 'expiring', withinDays],
    queryFn: () =>
      apiFetch<{ within_days: number; count: number; data: ExpiringReportRow[] }>(
        `/reports/expiring-documents${qs({ within_days: withinDays })}`,
      ),
  })

export function downloadExpiringCsv(withinDays: number): Promise<Blob> {
  return apiFetch<Blob>(`/reports/expiring-documents${qs({ within_days: withinDays, format: 'csv' })}`)
}

export const reportActivityQuery = (from?: string, to?: string) =>
  queryOptions({
    queryKey: ['reports', 'activity', from, to],
    queryFn: () =>
      apiFetch<{ from: string; to: string; members: ActivityMember[] }>(
        `/reports/user-activity${qs({ from, to })}`,
      ),
  })

export const reportExposureQuery = queryOptions({
  queryKey: ['reports', 'exposure'],
  queryFn: () => apiFetch<SharingExposureReport>('/reports/sharing-exposure'),
})

export const reportComplianceQuery = queryOptions({
  queryKey: ['reports', 'compliance'],
  queryFn: () => apiFetch<ComplianceReport>('/reports/compliance'),
})

export const reportWorkflowQuery = queryOptions({
  queryKey: ['reports', 'workflow'],
  queryFn: () => apiFetch<WorkflowPerfReport>('/reports/workflow-performance'),
})

// --- legal holds (W24 / B50, admin+) ----------------------------------------------

export const legalHoldsQuery = queryOptions({
  queryKey: ['legal-holds'],
  queryFn: () => apiFetch<{ data: LegalHold[] }>('/legal-holds'),
})

export function createLegalHold(name: string, description?: string): Promise<LegalHold> {
  return apiFetch<LegalHold>('/legal-holds', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export function addHoldItems(holdId: string, documentIds: string[]): Promise<{ added: number }> {
  return apiFetch<{ added: number }>(`/legal-holds/${holdId}/items`, {
    method: 'POST',
    body: JSON.stringify({ document_ids: documentIds }),
  })
}

/** First call opens the request (pending_second_approval); a second call by
 * a DIFFERENT admin releases. Self-approval → 409 LEGAL_HOLD_SELF_APPROVAL. */
export function releaseLegalHold(
  holdId: string,
  reason?: string,
): Promise<{ status: string; release_request_id: string | null }> {
  return apiFetch<{ status: string; release_request_id: string | null }>(
    `/legal-holds/${holdId}/release`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  )
}

export function revokeImportConnection(connectionId: string): Promise<void> {
  return apiFetch<void>(`/import-connections/${connectionId}`, { method: 'DELETE' })
}

export function createImportConnection(provider: string): Promise<CreateImportConnectionResult> {
  return apiFetch<CreateImportConnectionResult>('/import-connections', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  })
}

/** Plain fetch, not queryOptions: the folder picker owns its own paging state
 * (page_token accumulation), and caching stale Drive listings would only
 * confuse a picker that's open for seconds. */
export function browseConnection(
  connectionId: string,
  folderId?: string,
  pageToken?: string,
): Promise<DriveBrowse> {
  return apiFetch<DriveBrowse>(
    `/import-connections/${connectionId}/browse${qs({ folder_id: folderId, page_token: pageToken })}`,
  )
}

/** Drive import — exactly one of: a folder id (recursive walk; 'root' = the
 * whole My Drive, always an explicit choice) or a cherry-picked file-id list. */
export function startDriveImport(input: {
  connection_id: string
  drive_folder_id?: string
  drive_file_ids?: string[]
  target_folder_id?: string
  run_pipeline?: boolean
}): Promise<ImportJob> {
  return apiFetch<ImportJob>('/imports', {
    method: 'POST',
    body: JSON.stringify({
      connection_id: input.connection_id,
      target_folder_id: input.target_folder_id,
      run_pipeline: input.run_pipeline,
      mapping: input.drive_file_ids?.length
        ? { drive_file_ids: input.drive_file_ids }
        : { drive_folder_id: input.drive_folder_id },
    }),
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
