/** Feature flags for surfaces that are DESIGNED but not shipped (W23).
 * The auth screens reserve exact positions for these methods so nothing
 * moves when they land — flip the flag, wire the handler. */
export const flags = {
  /** Passkeys / WebAuthn login + enrollment (API deferred, spec §1). */
  authPasskeys: false,
  /** Enterprise SSO — email-domain-triggered continue button. */
  authSso: false,
  /** SMS as OTP channel (verify + MFA) — awaits an SMS provider. */
  authSms: false,
} as const
