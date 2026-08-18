/**
 * Pricing tiers.
 *
 * ── Two separate things are provisional here, and only one of them says so
 *    on screen. ────────────────────────────────────────────────────────────
 *
 * 1. THE PRICES. Not set. Every tier renders "Coming soon" or "Talk to us",
 *    and the section says plainly that the numbers are still being worked
 *    out. Nothing here invents a figure, a discount, a trial length or a
 *    guarantee.
 *
 * 2. WHICH TIER GETS WHICH FEATURE. This is a commercial decision, not an
 *    engineering one, and the split below is a first draft to be argued with.
 *    Every capability listed exists — nothing is promised that isn't built —
 *    but the line between Teams and Business is a guess. Move items freely;
 *    the cards read from this array and nothing else.
 *
 * `always()` is the deliberate exception: the things that are not sold
 * separately. Isolation between organizations is architectural rather than a
 * feature flag, and an audit trail that only the expensive plan keeps is not
 * an audit trail. Confirm this stays true commercially.
 */

export type Price = { kind: 'soon' } | { kind: 'contact' }

export type Tier = {
  id: string
  name: string
  who: string
  price: Price
  /** Rendered above the list when the tier builds on the previous one. */
  inherits?: string
  features: string[]
  cta: { label: string; href: string }
  accent: 'none' | 'violet'
}

import { mailto, REGISTER_URL } from '@/lib/links'
import type { Dict } from '@/i18n'

/**
 * `id` and `accent` are untranslated handles: `id` keys the React list and
 * `accent` picks a colour, so neither may move with the locale. `inherits`
 * reads the *name* of the tier below out of the same dictionary, so the
 * "Everything in Teams, plus:" line names the tier as that page calls it.
 */
export function tiers(t: Dict): Tier[] {
  return [
    {
      id: 'personal',
      name: t.pricing.tiers.personal.name,
      who: t.pricing.tiers.personal.who,
      price: { kind: 'soon' },
      features: [...t.pricing.tiers.personal.features],
      cta: { label: t.common.getStarted, href: REGISTER_URL },
      accent: 'none',
    },
    {
      id: 'teams',
      name: t.pricing.tiers.teams.name,
      who: t.pricing.tiers.teams.who,
      price: { kind: 'soon' },
      inherits: t.pricing.tiers.personal.name,
      features: [...t.pricing.tiers.teams.features],
      cta: { label: t.common.getStarted, href: REGISTER_URL },
      accent: 'none',
    },
    {
      id: 'business',
      name: t.pricing.tiers.business.name,
      who: t.pricing.tiers.business.who,
      price: { kind: 'soon' },
      inherits: t.pricing.tiers.teams.name,
      features: [...t.pricing.tiers.business.features],
      cta: { label: t.common.getStarted, href: REGISTER_URL },
      accent: 'none',
    },
    {
      id: 'enterprise',
      name: t.pricing.tiers.enterprise.name,
      who: t.pricing.tiers.enterprise.who,
      price: { kind: 'contact' },
      inherits: t.pricing.tiers.business.name,
      features: [...t.pricing.tiers.enterprise.features],
      cta: { label: t.pricing.talkToUs, href: mailto('KDB Doc Vault — Enterprise') },
      accent: 'violet',
    },
  ]
}

/** Not sold separately, on any plan. */
export function always(t: Dict): string[] {
  return [...t.pricing.always]
}
