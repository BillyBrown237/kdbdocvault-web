import type { Dict } from '@/i18n'

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

export function stages(t: Dict): Stage[] {
  return [
    {
      id: 'upload',
      name: t.workflow.stages.upload.name,
      blurb: t.workflow.stages.upload.blurb,
      availability: 'live',
    },
    {
      id: 'review',
      name: t.workflow.stages.review.name,
      blurb: t.workflow.stages.review.blurb,
      availability: 'live',
    },
    {
      id: 'approval',
      name: t.workflow.stages.approval.name,
      blurb: t.workflow.stages.approval.blurb,
      availability: 'live',
    },
    {
      id: 'signature',
      name: t.workflow.stages.signature.name,
      blurb: t.workflow.stages.signature.blurb,
      availability: 'live',
    },
    {
      id: 'archive',
      name: t.workflow.stages.archive.name,
      blurb: t.workflow.stages.archive.blurb,
      availability: 'live',
    },
  ]
}

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
export function steps(t: Dict): Step[] {
  return [
    {
      id: 'finance',
      party: t.workflow.steps.finance.party,
      who: 'Marie Ndongo',
      initials: 'MN',
      decision: 'approved',
      at: t.workflow.steps.finance.at,
      note: t.workflow.steps.finance.note,
    },
    {
      id: 'legal',
      party: t.workflow.steps.legal.party,
      who: 'Aïcha Bello',
      initials: 'AB',
      decision: 'returned',
      at: t.workflow.steps.legal.at,
      note: t.workflow.steps.legal.note,
    },
    {
      id: 'management',
      party: t.workflow.steps.management.party,
      who: 'Paul Ekani',
      initials: 'PE',
      decision: 'pending',
      at: t.workflow.steps.management.at,
      note: t.workflow.steps.management.note,
    },
  ]
}

export type StateKey = 'pending' | 'approved' | 'rejected' | 'signature' | 'completed'

export function states(
  t: Dict,
): { key: StateKey; label: string; copy: string; availability: Availability }[] {
  return [
    {
      key: 'pending',
      label: t.workflow.states.pending.label,
      copy: t.workflow.states.pending.copy,
      availability: 'live',
    },
    {
      key: 'approved',
      label: t.workflow.states.approved.label,
      copy: t.workflow.states.approved.copy,
      availability: 'live',
    },
    {
      key: 'rejected',
      label: t.workflow.states.rejected.label,
      copy: t.workflow.states.rejected.copy,
      availability: 'live',
    },
    {
      key: 'signature',
      label: t.workflow.states.signature.label,
      copy: t.workflow.states.signature.copy,
      availability: 'live',
    },
    {
      key: 'completed',
      label: t.workflow.states.completed.label,
      copy: t.workflow.states.completed.copy,
      availability: 'live',
    },
  ]
}
