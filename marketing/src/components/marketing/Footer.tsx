import { Container } from '@/components/ui/Container'
import { CONTACT_EMAIL, LOGIN_URL } from '@/lib/links'
import { Logo } from './Logo'
import { LanguageSwitch } from './LanguageSwitch'
import { useT, type Dict } from '@/i18n'

const YEAR = new Date().getFullYear()

/**
 * A destination in the footer.
 *
 * `href` is optional on purpose. Every column below has entries the site does
 * not have pages for yet — a roadmap, a blog, careers — and the two usual ways
 * of handling that are both wrong: dropping them loses the shape of the
 * product, and linking them to `/blog` ships a 404 the day someone clicks it.
 * So an entry without an `href` renders as dimmed text that isn't a link, and
 * one line under the columns explains why. Nine "coming soon" badges would
 * shout; one sentence does not.
 */
type FooterLink = { label: string; href?: string }

/**
 * `id` is the stable, untranslated handle for a column. The heading text moves
 * with the locale, but `aria-labelledby` and the React keys must not — a French
 * page would otherwise produce different DOM ids for the same column.
 */
function columns(t: Dict): { id: string; title: string; links: FooterLink[] }[] {
  return [
    {
      id: 'product',
      title: t.footer.columns.product,
      links: [
        { label: t.footer.links.features, href: '#features' },
        { label: t.footer.links.security, href: '#security' },
        { label: t.footer.links.integrations, href: '#sources' },
        { label: t.footer.links.pricing, href: '#pricing' },
        { label: t.footer.links.roadmap },
      ],
    },
    {
      id: 'solutions',
      title: t.footer.columns.solutions,
      links: [
        { label: t.footer.links.individuals, href: '#solutions' },
        { label: t.footer.links.teams, href: '#solutions' },
        { label: t.footer.links.businesses, href: '#solutions' },
        { label: t.footer.links.organizations, href: '#solutions' },
      ],
    },
    {
      id: 'resources',
      title: t.footer.columns.resources,
      links: [
        { label: t.footer.links.documentation },
        { label: t.footer.links.helpCenter },
        { label: t.footer.links.api },
        { label: t.footer.links.blog },
      ],
    },
    {
      id: 'company',
      title: t.footer.columns.company,
      links: [
        { label: t.footer.links.about },
        { label: t.footer.links.contact, href: `mailto:${CONTACT_EMAIL}` },
        { label: t.footer.links.careers },
      ],
    },
    {
      id: 'legal',
      title: t.footer.columns.legal,
      links: [
        { label: t.footer.links.privacy },
        { label: t.footer.links.terms },
        { label: t.footer.links.security, href: '#security' },
      ],
    },
  ]
}

export function Footer() {
  const t = useT()
  const cols = columns(t)
  const hasUnpublished = cols.some((c) => c.links.some((l) => !l.href))

  return (
    <footer className="border-t border-[var(--color-hairline)] bg-[var(--color-ink-950)]">
      <Container className="py-14 lg:py-16">
        {/* Brand first on a phone, beside the columns from `lg`. Five columns
            do not fit a 360px screen, so they fold to two and then three
            before taking their own row. */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.15fr_repeat(5,minmax(0,1fr))] lg:gap-8">
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--color-text-subtle)]">
              {t.footer.tagline}
            </p>
            <p className="mt-4 font-mono text-xs tracking-wide text-[var(--color-text-subtle)]">
              {t.footer.cities}
            </p>
          </div>

          {cols.map((col) => (
            <nav key={col.id} aria-labelledby={`footer-${col.id}`}>
              <h2
                id={`footer-${col.id}`}
                className="text-xs font-semibold tracking-[0.1em] text-[var(--color-text)] uppercase"
              >
                {col.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={`${col.id}-${link.label}`}>
                    {link.href ? (
                      <a
                        href={link.href}
                        className="rounded-sm text-sm text-[var(--color-text-subtle)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span className="text-sm text-[var(--color-text-subtle)]">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {hasUnpublished && (
          <p className="mt-12 text-xs text-[var(--color-text-subtle)]">{t.footer.unpublished}</p>
        )}

        <div className="mt-6 h-px divider-fade" />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-subtle)]">
            © {YEAR} KDB Doc Vault.{' '}
            <span className="text-[var(--color-text-subtle)]">{t.footer.product}</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={LOGIN_URL}
              className="rounded-sm text-xs text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
            >
              {t.common.signIn}
            </a>
            <LanguageSwitch />
            {/* Availability is a trust signal on a document platform: saying
                nothing about uptime is itself a statement. */}
            <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)]"
              />
              {t.footer.operational}
            </span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
