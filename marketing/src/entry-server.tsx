import { renderToString } from 'react-dom/server'
import App from './App'
import type { Locale } from './i18n'

// Re-exported so the prerender script needs one import: the same module that
// renders the page also tells it which locales exist and where each one lives.
export { DICTIONARIES, LOCALES, LOCALE_PATH, SITE_ORIGIN } from './i18n'

/**
 * Build-time render of the page, once per locale.
 *
 * Not a server: this runs during `npm run build` and its output is baked into
 * `dist/index.html` and `dist/fr/index.html` by `scripts/prerender.mjs`. The
 * site remains a static bundle — nginx serves files, nothing runs Node in
 * production.
 *
 * Why bother: before this, a crawler that does not execute JavaScript received
 * `<div id="root"></div>` and nothing else. Google renders JS eventually, but
 * link unfurlers, Bing and every other bot do not, and even for Google a page
 * that arrives already rendered is indexed sooner and more reliably. It also
 * removes the blank first paint.
 *
 * `react-dom/server` ships with React, so this costs no new dependency.
 */
export function render(locale: Locale): string {
  return renderToString(<App locale={locale} />)
}
