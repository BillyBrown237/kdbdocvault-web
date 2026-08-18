import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { LOGOS, logoCaption, PLACEHOLDER, QUOTES, type LogoSlot, type Quote } from './proof'
import { useT } from '@/i18n'

/**
 * Social proof.
 *
 * Fully built, deliberately unfilled. Everything about the layout is final —
 * the logo row, the three quote cards, the spacing, the responsive behaviour —
 * and all of the content lives in `proof.ts`, so real testimonials arrive as
 * an edit to one data file rather than a rebuild of this one.
 *
 * While `PLACEHOLDER` is true the section wears its state on the outside:
 * dashed logo tiles, a notice above the quotes, muted marks. That is on
 * purpose. A polished-looking section full of invented praise is the version
 * that ships by accident, because it looks finished to everyone who glances
 * at it.
 */
export function Proof() {
  const t = useT()

  return (
    <Section
      id="proof"
      tone="seam"
      eyebrow={t.proof.eyebrow}
      title={t.proof.title}
      lead={t.proof.lead}
    >
      {PLACEHOLDER && (
        <div className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-[var(--color-hairline-strong)] px-4 py-3">
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-micro text-[var(--color-text-muted)]">
            {t.proof.placeholderTag}
          </span>
          <p className="text-ui-sm text-[var(--color-text-subtle)]">
            {t.proof.placeholderBefore}
            <code className="font-mono text-[var(--color-text-muted)]">
              proof.ts
            </code>
            {t.proof.placeholderMiddle}
            <code className="font-mono text-[var(--color-text-muted)]">PLACEHOLDER</code>
            {t.proof.placeholderAfter}
            <code className="font-mono text-[var(--color-text-muted)]">false</code>.
          </p>
        </div>
      )}

      {/* The logo row. */}
      <div>
        <p className="text-center text-micro tracking-[0.14em] text-[var(--color-text-subtle)] uppercase">
          {logoCaption(t)}
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LOGOS.map((logo, i) => (
            <Reveal key={logo.name} index={i % 3}>
              <LogoTile logo={logo} />
            </Reveal>
          ))}
        </ul>
      </div>

      {/* The quotes. */}
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {QUOTES.map((q, i) => (
          <Reveal key={q.id} index={i} className="h-full">
            <QuoteCard quote={q} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function LogoTile({ logo }: { logo: LogoSlot }) {
  return (
    <li
      className={cn(
        'flex h-16 items-center justify-center rounded-xl px-4',
        logo.src
          ? 'border border-[var(--color-hairline)] bg-[var(--color-card)]/60'
          : 'border border-dashed border-[var(--color-hairline-strong)]',
      )}
    >
      {logo.src ? (
        // Muted by default and brought up on hover: six logos at full contrast
        // would out-shout the headline above them.
        <img
          src={logo.src}
          alt={logo.name}
          loading="lazy"
          className="h-6 w-auto max-w-full opacity-55 transition-opacity duration-[var(--duration-base)] hover:opacity-100"
        />
      ) : (
        <span className="font-mono text-meta text-[var(--color-text-subtle)]">
          {logo.name}
        </span>
      )}
    </li>
  )
}

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <figure
      className={cn(
        'flex h-full flex-col rounded-2xl border p-5 transition-colors duration-[var(--duration-base)] sm:p-6',
        PLACEHOLDER
          ? 'border-dashed border-[var(--color-hairline-strong)]'
          : 'border-[var(--color-hairline)] bg-[var(--color-card)]/60 hover:border-[var(--color-hairline-strong)]',
      )}
    >
      <span
        aria-hidden="true"
        className="font-sans text-3xl leading-none text-[var(--color-accent-400)]/40"
      >
        &ldquo;
      </span>

      <blockquote
        className={cn(
          'mt-2 text-card leading-relaxed',
          PLACEHOLDER ? 'text-[var(--color-text-subtle)] italic' : 'text-[var(--color-text)]',
        )}
      >
        {quote.quote}
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3 pt-6">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full text-micro font-medium',
            PLACEHOLDER
              ? 'border border-dashed border-[var(--color-hairline-strong)] text-[var(--color-text-subtle)]'
              : 'bg-[var(--color-ink-700)] text-[var(--color-text-muted)]',
          )}
        >
          {quote.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-ui font-medium text-[var(--color-text)]">
            {quote.name}
          </span>
          <span className="block truncate text-ui-sm text-[var(--color-text-subtle)]">
            {quote.role} · {quote.org}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
