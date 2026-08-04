/**
 * Single fetch pipeline for the KDB Vault API.
 *
 * - Base URL: same-origin `/v1` (Vite proxies to KdbVault.Api in dev, Caddy in prod)
 * - Access token lives in memory only; the refresh token is an httpOnly cookie
 *   owned by the server (`POST /auth/refresh` rotates it — see AuthTokens in the spec)
 * - 401 → single-flight refresh, then one retry
 * - Every non-GET request gets an `Idempotency-Key` (uuid) unless the caller set one
 * - Errors surface as `ApiProblem` (RFC 7807)
 *
 * Also serves as the orval mutator (`apiFetch`) for the generated client.
 */

/**
 * VITE_API_URL is the API ORIGIN only (e.g. https://api.kdbvault.com) — never
 * a path. Empty = same origin (dev proxy / Caddy). Version prefixes live HERE,
 * in one place:
 *  - versioned app API:      `${API_ORIGIN}/v1/...`   (apiFetch)
 *  - unversioned public API: capability surfaces whose URLs outlive versions
 *    (/sign, /shared, /verify). Same-origin they'd collide with the SPA's own
 *    routes, so they go through the `/pub` alias that the dev proxy / Caddy
 *    strips before forwarding (publicApiFetch).
 */
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? ''
export const API_V1 = `${API_ORIGIN}/v1`
const API_PUBLIC = import.meta.env.VITE_PUBLIC_API_URL ?? `${API_ORIGIN}/pub`

// --- access token (in-memory only, never persisted) -------------------------

let accessToken: string | null = null
let currentTenantId: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

/** Tenant scope of the current token (null = authenticated but tenant-less —
 * the onboarding state). Fed by login/refresh/switch-tenant responses. */
export function setCurrentTenantId(id: string | null): void {
  currentTenantId = id
}

export function getCurrentTenantId(): string | null {
  return currentTenantId
}

// --- RFC 7807 problem --------------------------------------------------------

export class ApiProblem extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly type?: string,
    public readonly raw?: unknown,
  ) {
    super(detail ?? title)
    this.name = 'ApiProblem'
  }
}

/** Thrown when the network itself failed (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('network_error')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

// --- single-flight refresh ----------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null

export async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_V1}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return false
      const body = (await res.json()) as { access_token?: string; tenant_id?: string | null }
      setAccessToken(body.access_token ?? null)
      setCurrentTenantId(body.tenant_id ?? null)
      return Boolean(body.access_token)
    } catch {
      return false
    }
  })()
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

// --- core fetch ---------------------------------------------------------------

async function doFetch(url: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers)

  const method = (options.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID())
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    return await fetch(url, { ...options, headers, credentials: 'include' })
  } catch (err) {
    throw new NetworkError(err)
  }
}

async function toProblem(res: Response): Promise<ApiProblem> {
  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = undefined
  }
  const p = (body ?? {}) as {
    title?: string
    detail?: string
    type?: string
  }
  return new ApiProblem(res.status, p.title ?? res.statusText, p.detail, p.type, body)
}

async function run<T>(target: string, url: string, options: RequestInit): Promise<T> {
  let res = await doFetch(target, options)

  // One refresh-and-retry, never for auth endpoints themselves.
  if (res.status === 401 && !url.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await doFetch(target, options)
    }
  }

  if (!res.ok) {
    throw await toProblem(res)
  }
  if (res.status === 204) {
    return undefined as T
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    return (await res.json()) as T
  }
  return (await res.blob()) as T
}

/**
 * Orval mutator + general-purpose call against the VERSIONED API.
 * `url` is spec-relative (e.g. `/documents`) — /v1 is prepended here.
 */
export function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const target = url.startsWith('http') ? url : `${API_V1}${url}`
  return run<T>(target, url, options)
}

/**
 * Call against the UNVERSIONED public surfaces (/sign, /shared, /verify …).
 * Routed via the `/pub` alias so the SPA's own routes with the same paths
 * don't collide; the proxy strips the alias.
 */
export function publicApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  return run<T>(`${API_PUBLIC}${url}`, url, options)
}
