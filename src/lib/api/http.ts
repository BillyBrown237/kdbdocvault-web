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

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/v1'

// --- access token (in-memory only, never persisted) -------------------------

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
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
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return false
      const body = (await res.json()) as { access_token?: string }
      setAccessToken(body.access_token ?? null)
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

  const target = url.startsWith('http') ? url : `${API_URL}${url}`
  try {
    return await fetch(target, { ...options, headers, credentials: 'include' })
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

/**
 * Orval mutator + general-purpose API call.
 * `url` is spec-relative (e.g. `/documents`), already query-stringified by orval.
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  let res = await doFetch(url, options)

  // One refresh-and-retry, never for auth endpoints themselves.
  if (res.status === 401 && !url.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await doFetch(url, options)
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
