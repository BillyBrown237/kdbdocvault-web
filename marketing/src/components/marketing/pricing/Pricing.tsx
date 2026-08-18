import { Check, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { ALWAYS, TIERS, type Tier } from './pricing'

/**
 * Pricing, before there are prices.
 *
 * The temptation on a page like this is to fill the empty space with the
 * things that don't need a finished price list — a struck-through figure, a
 * "most popular" ribbon, a customer count, a money-back promise. Every one of
 * those is a claim, and none of them is true yet, so none of them is here.
 *
 * What the section can honestly do is show the shape of the ladder: four
 * tiers, each building on the one before it, every capability listed being one
 * that exists. The prices say "Coming soon" and the section says why, once, at
 * the top — four identical badges with no explanation read as a broken page
 * rather than an honest one.
 *
 * No tier is highlighted as recommended. That is a claim about other people's
 * choices, and there aren't enough of them yet to make it.
 */
export function Pricing() {
  return (
    <Section
      id="pricing"
      tone="raised"
      eyebrow="Pricing"
      title="Plans designed to grow with your document needs."
      lead="The tiers are settled. The numbers are not — we would rather leave them blank than put up a figure we intend to change."
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.id} index={i} className="h-full">
            <Card tier={tier} />
          </Reveal>
        ))}
      </div>

      {/* The floor. Worth stating plainly: these are not the upsell. */}
      <div className="mt-8 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
        <p className="flex items-center gap-2 text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
          <ShieldCheck size={14} aria-hidden="true" className="text-[var(--color-accent-400)]" />
          On every plan, whatever the price turns out to be
        </p>
        <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {ALWAYS.map((a) => (
            <li
              key={a}
              className="flex items-start gap-2 text-ui leading-snug text-[var(--color-text-muted)]"
            >
              <Check
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-accent-400)]"
              />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function Card({ tier }: { tier: Tier }) {
  const enterprise = tier.accent === 'violet'

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-colors duration-[var(--duration-base)]',
        enterprise
          ? 'border-[rgb(167_139_250/0.28)] bg-[rgb(167_139_250/0.04)] hover:border-[rgb(167_139_250/0.45)]'
          : 'border-[var(--color-hairline)] bg-[var(--color-card)]/60 hover:border-[var(--color-hairline-strong)]',
      )}
    >
      <h3 className="text-h4 font-semibold tracking-[-0.02em] text-[var(--color-text)]">
        {tier.name}
      </h3>
      <p className="mt-2 min-h-[2.75rem] text-ui leading-relaxed text-[var(--color-text-subtle)]">
        {tier.who}
      </p>

      {/* Where a number will go. Dashed rather than blank, so the space reads
          as reserved instead of forgotten. */}
      <div className="mt-5">
        {tier.price.kind === 'soon' ? (
          <span className="inline-flex items-center rounded-lg border border-dashed border-[var(--color-hairline-strong)] px-3 py-1.5 text-ui text-[var(--color-text-subtle)]">
            Coming soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[rgb(167_139_250/0.4)] px-3 py-1.5 text-ui text-[var(--color-status-violet)]">
            <Mail size={14} aria-hidden="true" />
            Talk to us
          </span>
        )}
      </div>

      <div className="mt-5">
        <Button href={tier.cta.href} variant="secondary" size="md" className="w-full">
          {tier.cta.label}
        </Button>
      </div>

      <div className="mt-6 border-t border-[var(--color-hairline)] pt-5">
        {tier.inherits && (
          <p className="mb-3 text-ui-sm text-[var(--color-text-subtle)]">
            Everything in{' '}
            <span className="text-[var(--color-text-muted)]">{tier.inherits}</span>, plus:
          </p>
        )}
        <ul className="space-y-2.5">
          {tier.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-ui leading-snug text-[var(--color-text-muted)]"
            >
              <Check
                size={14}
                aria-hidden="true"
                className={cn(
                  'mt-0.5 shrink-0',
                  enterprise
                    ? 'text-[var(--color-status-violet)]'
                    : 'text-[var(--color-accent-400)]',
                )}
              />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
