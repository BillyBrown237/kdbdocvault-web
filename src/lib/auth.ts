/**
 * Hand-rolled auth surface (register/verify/login/MFA/logout/bootstrap).
 * Grounded in the backend's TokensResponse: { access_token, expires_in,
 * token_type, tenant_id, mfa_required?, challenge_token? } — the refresh
 * token is an httpOnly cookie, never visible to JS. tenant_id === null means
 * authenticated but tenant-less: the onboarding state.
 */
import {
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

export async function completeMfa(
  challengeToken: string,
  codes: { totp_code?: string; sms_code?: string },
): Promise<void> {
  const tokens = await apiFetch<AuthTokens>('/auth/mfa/challenge', {
    method: 'POST',
    body: JSON.stringify({ challenge_token: challengeToken, ...codes }),
  })
  adopt(tokens)
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
