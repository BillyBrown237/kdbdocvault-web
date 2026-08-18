/**
 * The contents of the product visualisation in the hero.
 *
 * These are the real object shapes the app works with — a document has an
 * owner, a lifecycle status, a version and an updated timestamp; a share link
 * has an expiry and a view budget. Keeping the mock honest matters: a visitor
 * who signs up should recognise the screen they were sold.
 *
 * The copy lives in the dictionary, so anything carrying words is a function of
 * `t` rather than a constant. Ids, people's names and file sizes are not copy
 * and stay where they are.
 */

import type { Dict } from '@/i18n'

export type Status = 'signed' | 'awaiting' | 'expiring' | 'draft' | 'archived'

export type Doc = {
  id: string
  name: string
  ext: 'PDF' | 'DOCX' | 'XLSX'
  folder: string
  owner: string
  version: string
  updated: string
  status: Status
  /** Only set when `status` is `expiring`. */
  expiresIn?: string
}

/** Pure style, so it stays a constant. The labels are in `statusLabels`. */
export const STATUS_META: Record<Status, { dot: string; text: string; chip: string }> = {
  signed: {
    dot: 'bg-[var(--color-accent-400)]',
    text: 'text-[var(--color-accent-400)]',
    chip: 'bg-[rgb(16_185_129/0.10)] ring-[rgb(16_185_129/0.22)]',
  },
  awaiting: {
    dot: 'bg-[var(--color-status-sky)]',
    text: 'text-[var(--color-status-sky)]',
    chip: 'bg-[rgb(56_189_248/0.10)] ring-[rgb(56_189_248/0.22)]',
  },
  expiring: {
    dot: 'bg-[var(--color-status-amber)]',
    text: 'text-[var(--color-status-amber)]',
    chip: 'bg-[rgb(245_158_11/0.10)] ring-[rgb(245_158_11/0.24)]',
  },
  draft: {
    dot: 'bg-[var(--color-slate-500)]',
    text: 'text-[var(--color-text-subtle)]',
    chip: 'bg-white/[0.04] ring-[rgb(148_163_184/0.18)]',
  },
  archived: {
    dot: 'bg-[var(--color-status-violet)]',
    text: 'text-[var(--color-status-violet)]',
    chip: 'bg-[rgb(167_139_250/0.10)] ring-[rgb(167_139_250/0.22)]',
  },
}

export function statusLabels(t: Dict): Record<Status, string> {
  return {
    signed: t.hero.status.signed,
    awaiting: t.hero.status.awaiting,
    expiring: t.hero.status.expiring,
    draft: t.hero.status.draft,
    archived: t.hero.status.archived,
  }
}

/** `id` is the key the visual reasons about; `name` is only ever displayed. */
export function folders(t: Dict) {
  return [
    { id: 'all', name: t.hero.folderNames.all, count: 1248, active: false },
    { id: 'contracts', name: t.hero.folderNames.contracts, count: 316, active: true },
    { id: 'invoices', name: t.hero.folderNames.invoices, count: 482, active: false },
    { id: 'hr', name: t.hero.folderNames.hr, count: 174, active: false },
    { id: 'compliance', name: t.hero.folderNames.compliance, count: 93, active: false },
    { id: 'archive', name: t.hero.folderNames.archive, count: 183, active: false },
  ]
}

/** The list as it first renders. */
export function docs(t: Dict): Doc[] {
  return [
    {
      id: 'msa',
      name: t.hero.docs.msa,
      ext: 'PDF',
      folder: 'Contracts',
      owner: 'Marie Ndongo',
      version: 'v4',
      updated: t.hero.when.minutes2,
      status: 'awaiting',
    },
    {
      id: 'tax',
      name: t.hero.docs.tax,
      ext: 'PDF',
      folder: 'Compliance',
      owner: 'Paul Ekani',
      version: 'v1',
      updated: t.hero.when.hour1,
      status: 'expiring',
      expiresIn: t.hero.status.expiresIn12,
    },
    {
      id: 'lease',
      name: t.hero.docs.lease,
      ext: 'DOCX',
      folder: 'Contracts',
      owner: 'Aïcha Bello',
      version: 'v2',
      updated: t.hero.when.yesterday,
      status: 'draft',
    },
    {
      id: 'payroll',
      name: t.hero.docs.payroll,
      ext: 'XLSX',
      folder: 'HR & payroll',
      owner: 'Jean Tchoua',
      version: 'v7',
      updated: t.hero.when.days3,
      status: 'signed',
    },
    {
      id: 'minutes',
      name: t.hero.docs.minutes,
      ext: 'PDF',
      folder: 'Archive',
      owner: 'Marie Ndongo',
      version: 'v1',
      updated: t.hero.when.apr12,
      status: 'archived',
    },
  ]
}

/** Arrives mid-animation, to show the workspace receiving a document. */
export function incomingDoc(t: Dict): Doc {
  return {
    id: 'amendment',
    name: t.hero.docs.amendment,
    ext: 'PDF',
    folder: 'Contracts',
    owner: 'Paul Ekani',
    version: 'v1',
    updated: t.hero.when.justNow,
    status: 'draft',
  }
}

export type Activity = { id: string; who: string; action: string; target: string; at: string }

export function activity(t: Dict): Activity[] {
  return [
    {
      id: 'a1',
      who: 'Aïcha Bello',
      action: t.hero.events.shared,
      target: t.hero.eventTargets.auditPack,
      at: '14 min',
    },
    {
      id: 'a2',
      who: 'Jean Tchoua',
      action: t.hero.events.archived,
      target: t.hero.eventTargets.minutesQ1,
      at: '1 h',
    },
    {
      id: 'a3',
      who: t.hero.system,
      action: t.hero.events.flagged,
      target: t.hero.eventTargets.taxClearance,
      at: '3 h',
    },
  ]
}

/**
 * Returned by reference, not copied: `useTypewriter` compares `phrases` by
 * identity, and the dictionary object is module-level in `en.ts` / `fr.ts`.
 */
export function searchPhrases(t: Dict): readonly string[] {
  return t.hero.searchPhrases
}

/** Where a selected document sits in its lifecycle. */
export function lifecycle(t: Dict): readonly string[] {
  return t.hero.steps
}
