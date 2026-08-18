import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import { DEFAULT_LOCALE, isLocale } from './i18n'
import './styles.css'

const root = document.getElementById('root')
// Failing loudly beats rendering into nothing and leaving a blank page with a
// clean console.
if (!root) throw new Error('#root is missing from index.html')

// The locale is read from the document rather than from the URL. The prerender
// writes `<html lang="fr">` into `/fr/index.html`, so the two can never
// disagree — and a URL check would have to know about trailing slashes, the
// dev server and any future path prefix.
const lang = document.documentElement.lang
const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

const app = (
  <StrictMode>
    <App locale={locale} />
  </StrictMode>
)

// The build prerenders the page into `#root`, so in production there is markup
// to adopt rather than replace. `npm run dev` serves an empty root and falls
// back to a normal client render — the same file works both ways without a
// flag to keep in sync.
if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
