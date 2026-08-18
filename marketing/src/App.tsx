import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'
import { Home } from '@/pages/Home'
import { dictionaryFor, LocaleProvider, type Locale } from '@/i18n'

/**
 * Application shell.
 *
 * The locale is a prop, not state. It is fixed for the lifetime of the page:
 * `/` renders English, `/fr/` renders French, and switching language is a
 * navigation rather than a re-render. That is what lets each language be a
 * separate prerendered document with its own canonical URL — a toggle held in
 * state would have left one URL and one indexable language.
 *
 * No router: there is one page per locale. When a second page arrives, the
 * change is here and nothing else — every component below navigates with plain
 * anchors, which work either way.
 */
export default function App({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider value={dictionaryFor(locale)}>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          <Home />
        </main>
        <Footer />
      </div>
    </LocaleProvider>
  )
}
