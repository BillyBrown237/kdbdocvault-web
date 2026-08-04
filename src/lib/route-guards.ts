import { redirect } from '@tanstack/react-router'

import { bootstrapSession, hasTenant } from './auth'

/** Authenticated — enough for onboarding surfaces. */
export async function requireAuth(location: { href: string }): Promise<void> {
  const authenticated = await bootstrapSession()
  if (!authenticated) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}

/** Authenticated AND tenant-scoped — the guard for the app proper.
 * Tenant-less users are parked at onboarding until they create/join one. */
export async function requireTenant(location: { href: string }): Promise<void> {
  await requireAuth(location)
  if (!hasTenant()) {
    throw redirect({ to: '/onboarding' })
  }
}
