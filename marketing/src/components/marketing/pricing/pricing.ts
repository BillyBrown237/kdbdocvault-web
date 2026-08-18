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
 * `ALWAYS` is the deliberate exception: the things that are not sold
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

export const TIERS: Tier[] = [
  {
    id: 'personal',
    name: 'Personal',
    who: 'For one person looking after their own documents.',
    price: { kind: 'soon' },
    features: [
      'Your own vault, reachable from any device',
      'Version history on every document',
      'Expiry dates, with reminders before they arrive',
      'Secure links with an expiry and a password',
      'Text read on upload, so documents are searchable',
    ],
    cta: { label: 'Get started', href: REGISTER_URL },
    accent: 'none',
  },
  {
    id: 'teams',
    name: 'Teams',
    who: 'For a small group working from the same documents.',
    price: { kind: 'soon' },
    inherits: 'Personal',
    features: [
      'Shared folders, with roles that decide who can do what',
      'Comments and mentions, kept on the document',
      'Approval requests',
      'Signature requests',
      'Activity everyone on the team can see',
    ],
    cta: { label: 'Get started', href: REGISTER_URL },
    accent: 'none',
  },
  {
    id: 'business',
    name: 'Business',
    who: 'For a company with real processes around its documents.',
    price: { kind: 'soon' },
    inherits: 'Teams',
    features: [
      'Multi-step approval workflows',
      'Retention rules and legal holds',
      'Document templates',
      'Import from Google Drive, OneDrive and Dropbox',
      'API keys and webhooks for your own systems',
      'Data rooms for a deal or an audit',
    ],
    cta: { label: 'Get started', href: REGISTER_URL },
    accent: 'none',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    who: 'For an organization that needs the whole estate governed.',
    price: { kind: 'contact' },
    inherits: 'Business',
    features: [
      'Organization-wide management, department by department',
      'Advanced permissions, down to a single document',
      'Workflows modelled on how your organization already approves things',
      'Auditability — export the trail for a document, a folder or a period',
      'Integrations with the systems your documents already come from',
      'Direct support, and help planning the move',
    ],
    cta: { label: 'Talk to us', href: mailto('KDB Doc Vault — Enterprise') },
    accent: 'violet',
  },
]

/** Not sold separately, on any plan. */
export const ALWAYS = [
  'Encrypted in transit and at rest',
  'Your organization’s data isolated from every other',
  'A full audit trail',
  'Every version kept',
]
