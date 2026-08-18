/**
 * The renewal board behind the lifecycle section.
 *
 * Days remaining are the fixed facts; the dates are derived from them, so the
 * board is still internally consistent a year from now. A hard-coded
 * "expires 13 Nov 2026" next to "in 87 days" goes wrong the day after it
 * ships, and nothing looks less like a working product than a dashboard whose
 * own arithmetic doesn't add up.
 */

const DAY = 86_400_000
const FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function dateIn(days: number): string {
  return FORMAT.format(new Date(Date.now() + days * DAY))
}

export function countdown(days: number): string {
  if (days <= 0) return 'Expired'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

/** Emerald while there is room to act, amber once there isn't. No red. */
export type Urgency = 'ok' | 'soon' | 'urgent'

export function urgencyOf(days: number): Urgency {
  if (days <= 1) return 'urgent'
  if (days <= 30) return 'soon'
  return 'ok'
}

export type Doc = {
  id: string
  name: string
  detail: string
  owner: string
  days: number
  icon: 'passport' | 'insurance' | 'licence' | 'contract'
}

export const DOCS: Doc[] = [
  {
    id: 'passport',
    name: 'Passport',
    detail: 'Identity document',
    owner: 'M. Ndongo',
    days: 87,
    icon: 'passport',
  },
  {
    id: 'insurance',
    name: 'Insurance',
    detail: 'Vehicle fleet policy',
    owner: 'Operations',
    days: 32,
    icon: 'insurance',
  },
  {
    id: 'licence',
    name: 'Business License',
    detail: 'Trade licence — Littoral',
    owner: 'Legal',
    days: 7,
    icon: 'licence',
  },
  {
    id: 'contract',
    name: 'Contract',
    detail: 'Framework agreement — Sofrigaz SA',
    owner: 'Finance',
    days: 1,
    icon: 'contract',
  },
]

/**
 * The axis. Five evenly spaced stops rather than a linear time scale — the
 * thresholds that matter are 90, 30, 7 and 1, and on a linear axis the last
 * three would pile up in the final centimetre.
 */
export const STOPS = [90, 30, 7, 1, 0] as const

/** Where a document sits along that axis, 0–100. */
export function positionOf(days: number): number {
  const bands = STOPS.length - 1
  if (days >= STOPS[0]) return 0
  for (let i = 0; i < bands; i += 1) {
    const from = STOPS[i] as number
    const to = STOPS[i + 1] as number
    if (days <= from && days > to) {
      const within = (from - days) / (from - to)
      return ((i + within) / bands) * 100
    }
  }
  return 100
}

export const LADDER = [
  {
    at: '90 days',
    action: 'The owner is notified and a renewal task is opened on the document itself.',
  },
  {
    at: '30 days',
    action: 'The reminder widens to everyone who shares the folder, so it stops being one person’s memory.',
  },
  {
    at: '7 days',
    action: 'A daily reminder, and the document is flagged wherever it appears in the vault.',
  },
  {
    at: '1 day',
    action: 'Push notification to registered devices, alongside the email.',
  },
  {
    at: 'Expired',
    action: 'Access follows the policy you set, the document moves to archive, and the audit trail records all of it.',
  },
] as const

export type Reminder = {
  id: string
  kind: 'email' | 'push' | 'task' | 'scheduled'
  title: string
  meta: string
  at: string
}

export const REMINDERS: Reminder[] = [
  {
    id: 'r1',
    kind: 'push',
    title: 'Contract expires tomorrow',
    meta: 'Push to 3 devices · Finance',
    at: 'just now',
  },
  {
    id: 'r2',
    kind: 'email',
    title: 'Business License — 7 days left',
    meta: 'Email to Legal · daily until renewed',
    at: '2 h ago',
  },
  {
    id: 'r3',
    kind: 'task',
    title: 'Renewal task assigned — Insurance',
    meta: 'Aïcha Bello · due in 32 days',
    at: 'yesterday',
  },
  {
    id: 'r4',
    kind: 'scheduled',
    title: 'Notice scheduled — Passport',
    meta: `30-day notice on ${dateIn(57)}`,
    at: 'queued',
  },
]
