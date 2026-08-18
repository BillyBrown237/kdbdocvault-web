import { cn } from '@/lib/cn'
import { LOCALE_PATH, LOCALES, useLocale, useT, type Locale } from '@/i18n'

const LABEL: Record<Locale, string> = { en: 'EN', fr: 'FR' }

/**
 * The language switch.
 *
 * Plain links, not a button with state. `/` and `/fr/` are two documents, so
 * changing language is a navigation — which also means the switch works
 * before JavaScript loads, and that a crawler following it finds the other
 * version instead of a dead control.
 *
 * `hrefLang` on each link tells the browser and any bot what it points at, and
 * the current locale carries `aria-current="page"` rather than being marked by
 * colour alone.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const current = useLocale()
  const t = useT()

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="group"
      aria-label={t.common.languageLabel}
    >
      {LOCALES.map((locale) => {
        const active = locale === current
        return (
          <a
            key={locale}
            href={LOCALE_PATH[locale]}
            hrefLang={locale}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-2 py-1 font-mono text-micro tracking-wide transition-colors duration-[var(--duration-fast)]',
              active
                ? 'bg-white/[0.06] text-[var(--color-text)]'
                : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
            )}
          >
            <span className="sr-only">
              {locale === 'en' ? t.common.switchToEnglish : t.common.switchToFrench}
            </span>
            <span aria-hidden="true">{LABEL[locale]}</span>
          </a>
        )
      })}
    </div>
  )
}
