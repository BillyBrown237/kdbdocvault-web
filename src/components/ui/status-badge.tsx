import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

/**
 * ONE rendering per backend enum value (W22). Every screen that shows a
 * status uses this — never an ad-hoc Badge variant map. Tones follow the
 * component-library spec: slate = dormant/neutral · azure = in motion ·
 * emerald = good outcome · amber = needs attention · red = bad outcome.
 * `pulse` marks the two states a user is actively waiting on.
 *
 * Labels come from the central `status.*` i18n table; an unmapped value
 * renders its raw name rather than hiding — honest over pretty.
 */

type Tone = 'slate' | 'azure' | 'emerald' | 'amber' | 'red'

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  azure: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

const DOT: Record<Tone, string> = {
  slate: 'bg-slate-500',
  azure: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

interface Spec {
  tone: Tone
  pulse?: boolean
}

const S = (tone: Tone, pulse?: boolean): Spec => ({ tone, pulse })

export const STATUS_DOMAINS = {
  document: {
    draft: S('slate'), active: S('emerald'), expiring: S('amber'),
    expired: S('red'), renewed: S('azure'), archived: S('slate'),
  },
  processing: {
    queued: S('slate'), processing: S('azure', true), done: S('emerald'), failed: S('red'),
  },
  job: {
    queued: S('slate'), running: S('azure', true), done: S('emerald'),
    failed: S('red'), cancelled: S('slate'),
  },
  envelope: {
    draft: S('slate'), sent: S('azure'), completed: S('emerald'),
    declined: S('red'), cancelled: S('slate'), expired: S('amber'),
  },
  signer: {
    pending: S('slate'), verified: S('azure'), signed: S('emerald'), declined: S('red'),
  },
  connection: {
    pending_auth: S('amber'), connected: S('emerald'), revoked: S('slate'),
  },
  payment: {
    pending: S('slate'), awaiting_confirmation: S('amber', true),
    succeeded: S('emerald'), failed: S('red'), refunded: S('azure'),
  },
  subscription: {
    trial: S('azure'), active: S('emerald'), past_due: S('amber'), cancelled: S('red'),
  },
  invoice: {
    paid: S('emerald'), open: S('amber'), void: S('slate'),
  },
  workflow: {
    running: S('azure'), completed: S('emerald'), cancelled: S('slate'), overdue: S('red'),
  },
  obligation: {
    open: S('slate'), done: S('emerald'), overdue: S('red'),
  },
  reminder: {
    scheduled: S('slate'), sent: S('azure'), acknowledged: S('emerald'), escalated: S('amber'),
  },
  hold: {
    active: S('red'), pending_release: S('amber'), released: S('slate'),
  },
  membership: {
    active: S('emerald'), suspended: S('amber'), pending: S('slate'),
  },
} satisfies Record<string, Record<string, Spec>>

export type StatusDomain = keyof typeof STATUS_DOMAINS

export function StatusBadge({
  domain,
  status,
  className,
}: {
  domain: StatusDomain
  status: string
  className?: string
}) {
  const { t } = useTranslation()
  const spec: Spec = (STATUS_DOMAINS[domain] as Record<string, Spec>)[status] ?? S('slate')
  const label = t(`status.${domain}.${status}`, { defaultValue: status.replace(/_/g, ' ') })

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[spec.tone],
        className,
      )}
    >
      {spec.pulse && (
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full motion-safe:animate-pulse', DOT[spec.tone])}
        />
      )}
      {label}
    </span>
  )
}
