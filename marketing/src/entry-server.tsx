import { renderToString } from 'react-dom/server'
import App from './App'

/**
 * Build-time render of the whole page to static HTML.
 *
 * Not a server: this runs once during `npm run build`, and its output is baked
 * into `dist/index.html` by `scripts/prerender.mjs`. The site is still a plain
 * static bundle afterwards — nginx serves files, nothing runs Node in
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
export function render(): string {
  return renderToString(<App />)
}
