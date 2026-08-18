/**
 * ─────────────────────────────────────────────────────────────────────────
 *  REPLACE THIS FILE WHEN REAL CONTENT EXISTS.  Nothing else needs touching.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. Fill in LOGOS and QUOTES below.
 * 2. Set PLACEHOLDER to false.
 *
 * That second step is the whole point of the flag. While it is `true` the
 * section renders in an obviously unfinished state — dashed tiles, a visible
 * notice — so placeholder credibility cannot reach production quietly. A
 * fabricated testimonial is the single fastest way to lose a reader who
 * recognises it, and the usual way one ships is that everybody assumed
 * somebody else had swapped it.
 */

import type { Dict } from '@/i18n'

export const PLACEHOLDER = true

export type LogoSlot = {
  /** Used as the alt text once `src` is set; shown as the label until then. */
  name: string
  /**
   * Path to a monochrome SVG in `public/logos/`. Brand marks sit on a near
   * black surface here, so supply white or single-colour versions — a full
   * colour logo will fight the page.
   */
  src?: string
}

export const LOGOS: LogoSlot[] = [
  { name: 'Logo 1' },
  { name: 'Logo 2' },
  { name: 'Logo 3' },
  { name: 'Logo 4' },
  { name: 'Logo 5' },
  { name: 'Logo 6' },
]

export type Quote = {
  id: string
  /** One or two sentences. Longer than three and nobody finishes it. */
  quote: string
  name: string
  role: string
  org: string
  /** Two letters. Derived from `name` once real names are in. */
  initials: string
}

/**
 * The placeholder text is deliberately a brief rather than invented praise:
 * it says what belongs in each slot, so it is useful while it waits and
 * unmistakable if it ever renders in front of a visitor.
 *
 * Deliberately not in the dictionary. These sentences are instructions to
 * whoever fills the slots in, not copy shown to a visitor on purpose, so
 * translating them would only mean maintaining the same brief twice.
 */
export const QUOTES: Quote[] = [
  {
    id: 'q1',
    quote:
      'Replace with a sentence about what was hard before — the specific thing that went wrong, not “we were disorganized”.',
    name: 'Name',
    role: 'Role',
    org: 'Organization',
    initials: '—',
  },
  {
    id: 'q2',
    quote:
      'Replace with a sentence about what changed, carrying one concrete detail: a deadline, a document, a week that went differently.',
    name: 'Name',
    role: 'Role',
    org: 'Organization',
    initials: '—',
  },
  {
    id: 'q3',
    quote:
      'Replace with a sentence somebody would actually say out loud. Cut anything that reads like a press release.',
    name: 'Name',
    role: 'Role',
    org: 'Organization',
    initials: '—',
  },
]

/** Shown above the logo row. Keep it modest and true. */
export function logoCaption(t: Dict): string {
  return t.proof.logoCaption
}
