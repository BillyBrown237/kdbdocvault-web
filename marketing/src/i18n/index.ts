import { createContext, useContext } from 'react'
import { en } from './en'
import { fr } from './fr'

/**
 * Two languages, decided at build time.
 *
 * There is no runtime detection and no localStorage. Each locale is a separate
 * prerendered page — `/` and `/fr/` — with its own `<html lang>`, its own
 * canonical URL and reciprocal `hreflang` tags, which is the only arrangement
 * a search engine can index twice. A client-side toggle on one URL would have
 * meant exactly one of the two languages ever being found.
 *
 * The dictionary is a plain typed object rather than i18next: the locale never
 * changes after the page is served, so there is nothing to detect, nothing to
 * lazy-load and no reason to put 15 kB of framework on a landing page. `fr` is
 * typed as `typeof en`, so a missing or misspelt key is a compile error rather
 * than a string that renders as `hero.title` in production.
 */

export type Locale = 'en' | 'fr'
export type Dict = typeof en

export const LOCALES: readonly Locale[] = ['en', 'fr']
export const DEFAULT_LOCALE: Locale = 'en'

export const DICTIONARIES: Record<Locale, Dict> = { en, fr }

/** Where each locale lives. English is at the root; nothing is at `/en/`. */
export const LOCALE_PATH: Record<Locale, string> = { en: '/', fr: '/fr/' }

export const SITE_ORIGIN = 'https://site.kdb.dekoubrown.dev'

export function localeUrl(locale: Locale): string {
  return `${SITE_ORIGIN}${LOCALE_PATH[locale]}`
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fr'
}

type LocaleValue = { locale: Locale; t: Dict }

const LocaleContext = createContext<LocaleValue>({ locale: DEFAULT_LOCALE, t: en })

export const LocaleProvider = LocaleContext.Provider

/** The dictionary for the page's locale. */
export function useT(): Dict {
  return useContext(LocaleContext).t
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale
}

export function dictionaryFor(locale: Locale): LocaleValue {
  return { locale, t: DICTIONARIES[locale] }
}
