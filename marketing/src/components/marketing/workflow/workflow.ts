/**
 * The workflow section's content.
 *
 * `availability` is the honest switch. Everything here is marked `live`
 * because everything here ships today — but the field, the badge and the
 * footnote are all wired, so the day a stage is ahead of the code, one word
 * changes and the page stops over-promising. That is much easier than
 * remembering to add a caveat under pressure.
 */

export type Availability = 'live' | 'soon'

export type Stage = {
  id: string
  name: string
  blurb: string
  availability: Availability
}

export const STAGES: Stage[] = [
  {
    id: 'upload',
    name: 'Upload',
    blurb: 'The document arrives in the vault and the process starts from it, not from an email about it.',
    availability: 'live',
  },
  {
    id: 'review',
    name: 'Review',
    blurb: 'Comments and mentions sit on the document itself, so the discussion stays where the file is.',
    availability: 'live',
  },
  {
    id: 'approval',
    name: 'Approval',
    blurb: 'Named approvers, in order. Each decision is recorded with who made it and when.',
    availability: 'live',
  },
  {
    id: 'signature',
    name: 'Signature',
    blurb: 'Once approved, the document can be sent for signature without leaving the vault.',
    availability: 'live',
  },
  {
    id: 'archive',
    name: 'Archive',
    blurb: 'When the process closes, the document is filed and held under its retention rule.',
    availability: 'live',
  },
]

export type Decision = 'approved' | 'pending' | 'returned'

export type Step = {
  id: string
  party: string
  who: string
  initials: string
  decision: Decision
  at: string
  note: string
}

/** The example: a supplier contract on its way through three desks. */
export const STEPS: Step[] = [
  {
    id: 'finance',
    party: 'Finance',
    who: 'Marie Ndongo',
    initials: 'MN',
    decision: 'approved',
    at: '12 Aug · 09:20',
    note: 'Budget line confirmed for the 2026 term.',
  },
  {
    id: 'legal',
    party: 'Legal',
    who: 'Aïcha Bello',
    initials: 'AB',
    decision: 'returned',
    at: '13 Aug · 14:02',
    note: 'Returned once for changes to the notice period — resubmitted as v2 and approved at 16:41.',
  },
  {
    id: 'management',
    party: 'Management',
    who: 'Paul Ekani',
    initials: 'PE',
    decision: 'pending',
    at: 'waiting since 14 Aug · 08:05',
    note: 'Last approval before the document goes out for signature.',
  },
]

export type StateKey = 'pending' | 'approved' | 'rejected' | 'signature' | 'completed'

export const STATES: { key: StateKey; label: string; copy: string; availability: Availability }[] = [
  {
    key: 'pending',
    label: 'Pending approval',
    copy: 'Sitting with a named person, not with “the team”. It appears in their queue and in the document’s own status.',
    availability: 'live',
  },
  {
    key: 'approved',
    label: 'Approved',
    copy: 'A decision recorded against a specific version, so approving v1 never silently approves v2.',
    availability: 'live',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    copy: 'Sent back with a reason. The document stays in place, the reason stays with it, and the next version resumes from there.',
    availability: 'live',
  },
  {
    key: 'signature',
    label: 'Signature requested',
    copy: 'Out for signature, with each signer’s status visible. Nothing has to be downloaded and re-uploaded.',
    availability: 'live',
  },
  {
    key: 'completed',
    label: 'Completed',
    copy: 'Every step closed. The document moves to its destination folder and its retention clock starts.',
    availability: 'live',
  },
]
