/**
 * The contents of the product visualisation in the hero.
 *
 * These are the real object shapes the app works with — a document has an
 * owner, a lifecycle status, a version and an updated timestamp; a share link
 * has an expiry and a view budget. Keeping the mock honest matters: a visitor
 * who signs up should recognise the screen they were sold.
 */

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

export const STATUS_META: Record<
  Status,
  { label: string; dot: string; text: string; chip: string }
> = {
  signed: {
    label: 'Signed',
    dot: 'bg-[var(--color-accent-400)]',
    text: 'text-[var(--color-accent-400)]',
    chip: 'bg-[rgb(16_185_129/0.10)] ring-[rgb(16_185_129/0.22)]',
  },
  awaiting: {
    label: 'Awaiting signature',
    dot: 'bg-[var(--color-status-sky)]',
    text: 'text-[var(--color-status-sky)]',
    chip: 'bg-[rgb(56_189_248/0.10)] ring-[rgb(56_189_248/0.22)]',
  },
  expiring: {
    label: 'Expiring',
    dot: 'bg-[var(--color-status-amber)]',
    text: 'text-[var(--color-status-amber)]',
    chip: 'bg-[rgb(245_158_11/0.10)] ring-[rgb(245_158_11/0.24)]',
  },
  draft: {
    label: 'Draft',
    dot: 'bg-[var(--color-slate-500)]',
    text: 'text-[var(--color-text-subtle)]',
    chip: 'bg-white/[0.04] ring-[rgb(148_163_184/0.18)]',
  },
  archived: {
    label: 'Archived',
    dot: 'bg-[var(--color-status-violet)]',
    text: 'text-[var(--color-status-violet)]',
    chip: 'bg-[rgb(167_139_250/0.10)] ring-[rgb(167_139_250/0.22)]',
  },
}

export const FOLDERS = [
  { name: 'All documents', count: 1248, active: false },
  { name: 'Contracts', count: 316, active: true },
  { name: 'Invoices', count: 482, active: false },
  { name: 'HR & payroll', count: 174, active: false },
  { name: 'Compliance', count: 93, active: false },
  { name: 'Archive', count: 183, active: false },
] as const

/** The list as it first renders. */
export const DOCS: Doc[] = [
  {
    id: 'msa',
    name: 'Master services agreement — Sofrigaz SA',
    ext: 'PDF',
    folder: 'Contracts',
    owner: 'Marie Ndongo',
    version: 'v4',
    updated: '2 min ago',
    status: 'awaiting',
  },
  {
    id: 'tax',
    name: 'Tax clearance certificate 2026',
    ext: 'PDF',
    folder: 'Compliance',
    owner: 'Paul Ekani',
    version: 'v1',
    updated: '1 h ago',
    status: 'expiring',
    expiresIn: 'Expires in 12 days',
  },
  {
    id: 'lease',
    name: 'Warehouse lease — Bonabéri',
    ext: 'DOCX',
    folder: 'Contracts',
    owner: 'Aïcha Bello',
    version: 'v2',
    updated: 'Yesterday',
    status: 'draft',
  },
  {
    id: 'payroll',
    name: 'Payroll register — July 2026',
    ext: 'XLSX',
    folder: 'HR & payroll',
    owner: 'Jean Tchoua',
    version: 'v7',
    updated: '3 days ago',
    status: 'signed',
  },
  {
    id: 'minutes',
    name: 'Board minutes — Q1 2026',
    ext: 'PDF',
    folder: 'Archive',
    owner: 'Marie Ndongo',
    version: 'v1',
    updated: '12 Apr',
    status: 'archived',
  },
]

/** Arrives mid-animation, to show the workspace receiving a document. */
export const INCOMING_DOC: Doc = {
  id: 'amendment',
  name: 'Amendment no. 2 — Sofrigaz SA',
  ext: 'PDF',
  folder: 'Contracts',
  owner: 'Paul Ekani',
  version: 'v1',
  updated: 'Just now',
  status: 'draft',
}

export type Activity = { id: string; who: string; action: string; target: string; at: string }

export const ACTIVITY: Activity[] = [
  { id: 'a1', who: 'Aïcha Bello', action: 'shared a secure link to', target: 'Q2 audit pack', at: '14 min' },
  { id: 'a2', who: 'Jean Tchoua', action: 'archived', target: 'Board minutes — Q1', at: '1 h' },
  { id: 'a3', who: 'System', action: 'flagged an expiry on', target: 'Tax clearance', at: '3 h' },
]

export const SEARCH_PHRASES = [
  'contracts expiring this quarter',
  'signed by Marie Ndongo',
  'invoices · Sofrigaz SA',
] as const

/** Where a selected document sits in its lifecycle. */
export const LIFECYCLE = ['Received', 'In review', 'Signed', 'Archived'] as const
