/**
 * Hand-rolled auth surface (register/verify/login/MFA/logout/bootstrap).
 * Grounded in the backend's TokensResponse: { access_token, expires_in,
 * token_type, tenant_id, mfa_required?, challenge_token? } — the refresh
 * token is an httpOnly cookie, never visible to JS. tenant_id === null means
 * authenticated but tenant-less: the onboarding state.
 */
import {
  ApiProblem,
  apiFetch,
  getAccessToken,
  getCurrentTenantId,
  refreshAccessToken,
  setAccessToken,
  setCurrentTenantId,
} from './api/http'

export interface AuthTokens {
  access_token?: string
  expires_in?: number
  token_type?: 'Bearer'
  tenant_id?: string | null
  mfa_required?: boolean
  challenge_token?: string | null
}

export interface LoginResult {
  status: 'ok' | 'mfa_required'
  challengeToken?: string
  tenantId: string | null
}

function adopt(tokens: AuthTokens): void {
  setAccessToken(tokens.access_token ?? null)
  setCurrentTenantId(tokens.tenant_id ?? null)
}

export async function register(
  email: string,
  password: string,
  locale: 'fr' | 'en',
): Promise<void> {
  await apiFetch<unknown>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, locale }),
  })
}

export async function verifyIdentifier(identifier: string, code: string): Promise<void> {
  await apiFetch<unknown>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ identifier, code }),
  })
}

/**
 * B70/W33 — enterprise SSO.
 *
 * `ssoStart` is called on CLICK, not on blur: GET /start writes a one-shot
 * state row server-side, and probing it on every keystroke would mint junk
 * rows for nothing. 404 means "no SSO for that domain" and is returned as
 * null rather than thrown — it is an answer, not an error.
 *
 * The `{provider}` path segment is the email domain. The callback handler
 * ignores it (the state row already knows its connection), so the callback
 * uses the domain remembered from start, falling back to '_'.
 */
export async function ssoStart(
  domain: string,
  redirect?: string,
): Promise<{ authorizeUrl: string; displayName: string } | null> {
  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  try {
    const r = await apiFetch<{ authorize_url: string; display_name: string }>(
      `/auth/sso/${encodeURIComponent(domain)}/start${qs}`,
    )
    sessionStorage.setItem('kdb.sso.domain', domain)
    return { authorizeUrl: r.authorize_url, displayName: r.display_name }
  } catch (err) {
    if (err instanceof ApiProblem && err.status === 404) return null
    throw err
  }
}

export async function ssoComplete(state: string, code: string): Promise<LoginResult> {
  const domain = sessionStorage.getItem('kdb.sso.domain') ?? '_'
  sessionStorage.removeItem('kdb.sso.domain')
  const tokens = await apiFetch<AuthTokens>(`/auth/sso/${encodeURIComponent(domain)}/callback`, {
    method: 'POST',
    body: JSON.stringify({ state, code }),
  })
  adopt(tokens)
  return { status: 'ok', tenantId: tokens.tenant_id ?? null }
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  const tokens = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  if (tokens.mfa_required) {
    return {
      status: 'mfa_required',
      challengeToken: tokens.challenge_token ?? undefined,
      tenantId: null,
    }
  }
  adopt(tokens)
  return { status: 'ok', tenantId: tokens.tenant_id ?? null }
}

// Short-lived, in-memory only: the challenge token from a login that needs MFA.
// Not persisted — a page refresh drops it and the user re-authenticates.
let pendingChallenge: string | null = null
export function setPendingChallenge(token: string | null): void {
  pendingChallenge = token
}
export function getPendingChallenge(): string | null {
  return pendingChallenge
}

export async function completeMfa(codes: {
  totp_code?: string
  sms_code?: string
}): Promise<{ tenantId: string | null }> {
  if (!pendingChallenge) throw new Error('no pending challenge')
  const tokens = await apiFetch<AuthTokens>('/auth/mfa/challenge', {
    method: 'POST',
    body: JSON.stringify({ challenge_token: pendingChallenge, ...codes }),
  })
  adopt(tokens)
  pendingChallenge = null
  return { tenantId: tokens.tenant_id ?? null }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
    setCurrentTenantId(null)
  }
}

/**
 * App-start session restore: if the refresh cookie is still valid the server
 * mints a fresh access token (refresh response carries tenant_id too).
 */
export async function bootstrapSession(): Promise<boolean> {
  if (getAccessToken()) return true
  return refreshAccessToken()
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

export function hasTenant(): boolean {
  return getCurrentTenantId() !== null
}
