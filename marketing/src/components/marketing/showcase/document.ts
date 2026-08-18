/**
 * The example document behind the showcase section.
 *
 * One document, described the way KDB Doc Vault actually describes it. Every
 * panel in the showcase reads from here, so the story stays consistent: the
 * version history explains the current version, the activity feed accounts for
 * the approval, and the workflow explains what happens at the expiry date.
 */

export const DOC = {
  name: 'Contract.pdf',
  subtitle: 'Framework agreement — logistics services',
  owner: 'Finance Department',
  createdISO: '2026-08-12',
  expiresISO: '2027-08-12',
  created: 'August 12, 2026',
  expires: 'August 12, 2027',
  access: 'Finance Team',
  pages: 12,
  reference: 'CTR-2026-0184',
} as const

export type Version = {
  id: string
  label: string
  date: string
  author: string
  size: string
  note: string
}

/** Newest first — the order the product lists them in. */
export const VERSIONS: Version[] = [
  {
    id: 'v4',
    label: 'v4',
    date: '14 Aug 2026 · 09:12',
    author: 'Marie Ndongo',
    size: '412 KB',
    note: 'Clause 12.3 added — termination notice raised to 90 days.',
  },
  {
    id: 'v3',
    label: 'v3',
    date: '13 Aug 2026 · 17:44',
    author: 'Paul Ekani',
    size: '409 KB',
    note: 'Legal review comments applied.',
  },
  {
    id: 'v2',
    label: 'v2',
    date: '12 Aug 2026 · 14:03',
    author: 'Marie Ndongo',
    size: '401 KB',
    note: 'Annexes A and B attached.',
  },
  {
    id: 'v1',
    label: 'v1',
    date: '12 Aug 2026 · 08:30',
    author: 'Marie Ndongo',
    size: '388 KB',
    note: 'Initial upload.',
  },
]

export type Event = {
  id: string
  who: string
  action: string
  at: string
  meta: string
  tone: 'accent' | 'sky' | 'muted'
}

export const EVENTS: Event[] = [
  {
    id: 'e1',
    who: 'Alice Mbala',
    action: 'viewed the document',
    at: 'Today · 09:41',
    meta: 'Web · Douala · v4',
    tone: 'muted',
  },
  {
    id: 'e2',
    who: 'Finance Department',
    action: 'approved',
    at: '14 Aug · 16:20',
    meta: 'Approval step 2 of 2',
    tone: 'accent',
  },
  {
    id: 'e3',
    who: 'Marie Ndongo',
    action: 'shared with Legal',
    at: '13 Aug · 11:05',
    meta: 'Secure link · view only · expires in 7 days',
    tone: 'sky',
  },
  {
    id: 'e4',
    who: 'Marie Ndongo',
    action: 'uploaded v4',
    at: '14 Aug · 09:12',
    meta: 'Replaces v3 · previous version kept',
    tone: 'muted',
  },
  {
    id: 'e5',
    who: 'Marie Ndongo',
    action: 'created the document',
    at: '12 Aug · 08:30',
    meta: 'Folder: Contracts / Active',
    tone: 'muted',
  },
]

export type Principal = {
  id: string
  name: string
  detail: string
  role: string
  /** View · Download · Share · Delete */
  grants: [boolean, boolean, boolean, boolean]
  summary: string
}

export const PRINCIPALS: Principal[] = [
  {
    id: 'finance',
    name: 'Finance Team',
    detail: '5 members',
    role: 'Editor',
    grants: [true, true, true, false],
    summary: 'Full access. Members may re-share inside the organization, but cannot delete a document under retention.',
  },
  {
    id: 'legal',
    name: 'Legal',
    detail: '2 members',
    role: 'Reviewer',
    grants: [true, true, false, false],
    summary: 'Read and download for review. Cannot re-share — the link they were given does not travel further.',
  },
  {
    id: 'guest',
    name: 'Guest link',
    detail: 'External counsel',
    role: 'Viewer',
    grants: [true, false, false, false],
    summary: 'Watermarked preview in the browser. Expires in 7 days, 2 of 5 views used, password required.',
  },
]

export const CAPABILITIES = ['View', 'Download', 'Share', 'Delete'] as const

export const WORKFLOW = [
  { name: 'Drafted', at: '12 Aug' },
  { name: 'Legal review', at: '13 Aug' },
  { name: 'Approved', at: '14 Aug' },
  { name: 'Active', at: 'now' },
  { name: 'Renewal', at: 'May 2027' },
] as const

/** Index of the step the document is on. */
export const WORKFLOW_CURRENT = 3

export const RULES = [
  { when: '90 days before expiry', then: 'notify Finance + Legal' },
  { when: 'on approval', then: 'move to Contracts / Active' },
  { when: 'on expiry', then: 'archive · retain 10 years' },
] as const
