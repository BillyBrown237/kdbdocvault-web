/**
 * The example document behind the showcase section.
 *
 * One document, described the way KDB Doc Vault actually describes it. Every
 * panel in the showcase reads from here, so the story stays consistent: the
 * version history explains the current version, the activity feed accounts for
 * the approval, and the workflow explains what happens at the expiry date.
 *
 * Everything carrying copy is a function of the dictionary. Ids, the file name,
 * the reference code, dates, sizes and the people are not copy and stay put.
 */

import type { Dict } from '@/i18n'

export function doc(t: Dict) {
  return {
    name: 'Contract.pdf',
    subtitle: t.showcase.doc.subtitle,
    owner: t.showcase.doc.owner,
    createdISO: '2026-08-12',
    expiresISO: '2027-08-12',
    created: t.showcase.doc.created,
    expires: t.showcase.doc.expires,
    access: t.showcase.doc.access,
    pages: 12,
    reference: 'CTR-2026-0184',
  } as const
}

export type Version = {
  id: string
  label: string
  date: string
  author: string
  size: string
  note: string
}

/** Newest first — the order the product lists them in. */
export function versions(t: Dict): Version[] {
  return [
    {
      id: 'v4',
      label: 'v4',
      date: '14 Aug 2026 · 09:12',
      author: 'Marie Ndongo',
      size: '412 KB',
      note: t.showcase.versions.notes.v4,
    },
    {
      id: 'v3',
      label: 'v3',
      date: '13 Aug 2026 · 17:44',
      author: 'Paul Ekani',
      size: '409 KB',
      note: t.showcase.versions.notes.v3,
    },
    {
      id: 'v2',
      label: 'v2',
      date: '12 Aug 2026 · 14:03',
      author: 'Marie Ndongo',
      size: '401 KB',
      note: t.showcase.versions.notes.v2,
    },
    {
      id: 'v1',
      label: 'v1',
      date: '12 Aug 2026 · 08:30',
      author: 'Marie Ndongo',
      size: '388 KB',
      note: t.showcase.versions.notes.v1,
    },
  ]
}

export type Event = {
  id: string
  who: string
  action: string
  at: string
  meta: string
  tone: 'accent' | 'sky' | 'muted'
}

export function events(t: Dict): Event[] {
  return [
    {
      id: 'e1',
      who: 'Alice Mbala',
      action: t.showcase.activity.events.viewed.action,
      at: t.showcase.activity.events.viewed.at,
      meta: t.showcase.activity.events.viewed.meta,
      tone: 'muted',
    },
    {
      id: 'e2',
      who: t.showcase.doc.owner,
      action: t.showcase.activity.events.approved.action,
      at: t.showcase.activity.events.approved.at,
      meta: t.showcase.activity.events.approved.meta,
      tone: 'accent',
    },
    {
      id: 'e3',
      who: 'Marie Ndongo',
      action: t.showcase.activity.events.shared.action,
      at: t.showcase.activity.events.shared.at,
      meta: t.showcase.activity.events.shared.meta,
      tone: 'sky',
    },
    {
      id: 'e4',
      who: 'Marie Ndongo',
      action: t.showcase.activity.events.uploaded.action,
      at: t.showcase.activity.events.uploaded.at,
      meta: t.showcase.activity.events.uploaded.meta,
      tone: 'muted',
    },
    {
      id: 'e5',
      who: 'Marie Ndongo',
      action: t.showcase.activity.events.created.action,
      at: t.showcase.activity.events.created.at,
      meta: t.showcase.activity.events.created.meta,
      tone: 'muted',
    },
  ]
}

export type Principal = {
  id: string
  name: string
  detail: string
  role: string
  /** View · Download · Share · Delete */
  grants: [boolean, boolean, boolean, boolean]
  summary: string
}

/** `id` is the state key the permissions panel uses; only `name` is displayed. */
export function principals(t: Dict): Principal[] {
  return [
    {
      id: 'finance',
      name: t.showcase.permissions.principals.finance.name,
      detail: t.showcase.permissions.principals.finance.detail,
      role: t.showcase.permissions.principals.finance.role,
      grants: [true, true, true, false],
      summary: t.showcase.permissions.principals.finance.summary,
    },
    {
      id: 'legal',
      name: t.showcase.permissions.principals.legal.name,
      detail: t.showcase.permissions.principals.legal.detail,
      role: t.showcase.permissions.principals.legal.role,
      grants: [true, true, false, false],
      summary: t.showcase.permissions.principals.legal.summary,
    },
    {
      id: 'guest',
      name: t.showcase.permissions.principals.guest.name,
      detail: t.showcase.permissions.principals.guest.detail,
      role: t.showcase.permissions.principals.guest.role,
      grants: [true, false, false, false],
      summary: t.showcase.permissions.principals.guest.summary,
    },
  ]
}

/** Same order as `Principal['grants']`. */
export function capabilities(t: Dict): readonly string[] {
  return t.showcase.permissions.capabilities
}

export function workflow(t: Dict) {
  return t.showcase.workflow.steps
}

/** Index of the step the document is on. */
export const WORKFLOW_CURRENT = 3

export function rules(t: Dict) {
  return t.showcase.workflow.rules
}
