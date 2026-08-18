/**
 * The renewal board behind the lifecycle section.
 *
 * Days remaining are the fixed facts; the dates are derived from them, so the
 * board is still internally consistent a year from now. A hard-coded
 * "expires 13 Nov 2026" next to "in 87 days" goes wrong the day after it
 * ships, and nothing looks less like a working product than a dashboard whose
 * own arithmetic doesn't add up.
 */

import type { Dict, Locale } from '@/i18n'

const DAY = 86_400_000
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}

export function dateIn(locale: Locale, days: number): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', DATE_FORMAT).format(
    new Date(Date.now() + days * DAY),
  )
}

export function countdown(t: Dict, days: number): string {
  if (days <= 0) return t.lifecycle.expired
  if (days === 1) return t.lifecycle.expiresTomorrow
  return t.lifecycle.expiresIn(days)
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

export function docs(t: Dict): Doc[] {
  return [
    {
      id: 'passport',
      name: t.lifecycle.docs.passport.name,
      detail: t.lifecycle.docs.passport.detail,
      owner: t.lifecycle.docs.passport.owner,
      days: 87,
      icon: 'passport',
    },
    {
      id: 'insurance',
      name: t.lifecycle.docs.insurance.name,
      detail: t.lifecycle.docs.insurance.detail,
      owner: t.lifecycle.docs.insurance.owner,
      days: 32,
      icon: 'insurance',
    },
    {
      id: 'licence',
      name: t.lifecycle.docs.licence.name,
      detail: t.lifecycle.docs.licence.detail,
      owner: t.lifecycle.docs.licence.owner,
      days: 7,
      icon: 'licence',
    },
    {
      id: 'contract',
      name: t.lifecycle.docs.contract.name,
      detail: t.lifecycle.docs.contract.detail,
      owner: t.lifecycle.docs.contract.owner,
      days: 1,
      icon: 'contract',
    },
  ]
}

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

export function ladder(t: Dict) {
  return t.lifecycle.ladder
}

export type Reminder = {
  id: string
  kind: 'email' | 'push' | 'task' | 'scheduled'
  title: string
  meta: string
  at: string
}

export function reminders(t: Dict, locale: Locale): Reminder[] {
  return [
    {
      id: 'r1',
      kind: 'push',
      title: t.lifecycle.reminders.contract.title,
      meta: t.lifecycle.reminders.contract.meta,
      at: t.lifecycle.reminders.contract.at,
    },
    {
      id: 'r2',
      kind: 'email',
      title: t.lifecycle.reminders.licence.title,
      meta: t.lifecycle.reminders.licence.meta,
      at: t.lifecycle.reminders.licence.at,
    },
    {
      id: 'r3',
      kind: 'task',
      title: t.lifecycle.reminders.insurance.title,
      meta: t.lifecycle.reminders.insurance.meta,
      at: t.lifecycle.reminders.insurance.at,
    },
    {
      id: 'r4',
      kind: 'scheduled',
      title: t.lifecycle.reminders.passport.title,
      meta: t.lifecycle.reminders.passport.meta(dateIn(locale, 57)),
      at: t.lifecycle.reminders.passport.at,
    },
  ]
}
