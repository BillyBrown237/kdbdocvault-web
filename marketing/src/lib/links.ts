/**
 * Every outbound destination on the site, in one place.
 *
 * These were previously copied into six components, which is how a site ends
 * up shipping half its buttons pointing at a domain nobody owns. One edit
 * here now moves every call to action.
 *
 * ⚠ CONFIRM BEFORE LAUNCH. Derived from the canonical URL in `index.html`
 *   (`https://site.kdb.dekoubrown.com/`), not from anything authoritative:
 *   the application host and the contact address below are both assumptions.
 */

export const APP_URL = 'https://kdb.dekoubrown.com'

export const LOGIN_URL = `${APP_URL}/login`
export const REGISTER_URL = `${APP_URL}/register`

export const CONTACT_EMAIL = 'contact@kdb.dekoubrown.com'

/** `mailto:` with a subject line, so a reply lands somewhere sortable. */
export function mailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
}
