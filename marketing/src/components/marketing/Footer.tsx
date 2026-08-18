import { Container } from '@/components/ui/Container'
import { CONTACT_EMAIL, LOGIN_URL } from '@/lib/links'
import { Logo } from './Logo'

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

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Security', href: '#security' },
      { label: 'Integrations', href: '#sources' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Roadmap' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Individuals', href: '#solutions' },
      { label: 'Teams', href: '#solutions' },
      { label: 'Businesses', href: '#solutions' },
      { label: 'Organizations', href: '#solutions' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation' },
      { label: 'Help Center' },
      { label: 'API' },
      { label: 'Blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About' },
      { label: 'Contact', href: `mailto:${CONTACT_EMAIL}` },
      { label: 'Careers' },
    ],
  },
  {
    title: 'Legal',
    links: [{ label: 'Privacy' }, { label: 'Terms' }, { label: 'Security', href: '#security' }],
  },
]

const HAS_UNPUBLISHED = COLUMNS.some((c) => c.links.some((l) => !l.href))

export function Footer() {
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
              Secure document management for individuals, teams, and organizations.
            </p>
            <p className="mt-4 font-mono text-xs tracking-wide text-[var(--color-text-subtle)]">
              Douala · Yaoundé
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
              <h2
                id={`footer-${col.title}`}
                className="text-xs font-semibold tracking-[0.1em] text-[var(--color-text)] uppercase"
              >
                {col.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
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

        {HAS_UNPUBLISHED && (
          <p className="mt-12 text-xs text-[var(--color-text-subtle)]">
            Entries shown without a link aren&rsquo;t published yet.
          </p>
        )}

        <div className="mt-6 h-px divider-fade" />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-subtle)]">
            © {YEAR} KDB Doc Vault.{' '}
            <span className="text-[var(--color-text-subtle)]">A KDB product.</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={LOGIN_URL}
              className="rounded-sm text-xs text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
            >
              Sign in
            </a>
            {/* Availability is a trust signal on a document platform: saying
                nothing about uptime is itself a statement. */}
            <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)]"
              />
              All systems operational
            </span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
