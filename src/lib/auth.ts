/**
 * Hand-rolled auth surface (login/MFA/logout/bootstrap).
 * Grounded in the OpenAPI spec: AuthTokens = { access_token, expires_in,
 * token_type, mfa_required, challenge_token } — refresh token is an httpOnly
 * cookie, never visible to JS.
 *
 * Once `npm run api:generate` produces the orval client, the request calls
 * here can be swapped for generated functions; the token handling stays.
 */
import { apiFetch, getAccessToken, refreshAccessToken, setAccessToken } from './api/http'

export interface AuthTokens {
  access_token?: string
  expires_in?: number
  token_type?: 'Bearer'
  mfa_required?: boolean
  challenge_token?: string | null
}

export interface LoginResult {
  status: 'ok' | 'mfa_required'
  challengeToken?: string
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  const tokens = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  if (tokens.mfa_required) {
    return { status: 'mfa_required', challengeToken: tokens.challenge_token ?? undefined }
  }
  setAccessToken(tokens.access_token ?? null)
  return { status: 'ok' }
}

export async function completeMfa(
  challengeToken: string,
  codes: { totp_code?: string; sms_code?: string },
): Promise<void> {
  const tokens = await apiFetch<AuthTokens>('/auth/mfa/challenge', {
    method: 'POST',
    body: JSON.stringify({ challenge_token: challengeToken, ...codes }),
  })
  setAccessToken(tokens.access_token ?? null)
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}

/**
 * App-start session restore: if the refresh cookie is still valid the server
 * mints a fresh access token. Returns whether a session exists.
 */
export async function bootstrapSession(): Promise<boolean> {
  if (getAccessToken()) return true
  return refreshAccessToken()
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}
