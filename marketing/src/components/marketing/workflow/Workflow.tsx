import type { ReactNode } from 'react'
import {
  Archive,
  Check,
  CheckCheck,
  ClipboardCheck,
  Clock,
  CornerUpLeft,
  MessageSquare,
  PenLine,
  Signature,
  Upload,
  X,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'
import { useSequence } from '@/lib/useSequence'
import { useT, type Dict } from '@/i18n'
import {
  stages,
  states,
  steps,
  type Availability,
  type Decision,
  type StateKey,
  type Step,
} from './workflow'

const STAGE_ICON: Record<string, ReactNode> = {
  upload: <Upload size={14} aria-hidden="true" />,
  review: <MessageSquare size={14} aria-hidden="true" />,
  approval: <ClipboardCheck size={14} aria-hidden="true" />,
  signature: <Signature size={14} aria-hidden="true" />,
  archive: <Archive size={14} aria-hidden="true" />,
}

const STATE_STYLE: Record<StateKey, { chip: string; icon: ReactNode }> = {
  pending: {
    chip: 'bg-[rgb(56_189_248/0.10)] text-[var(--color-status-sky)] ring-[rgb(56_189_248/0.24)]',
    icon: <Clock size={12} aria-hidden="true" />,
  },
  approved: {
    chip: 'bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.24)]',
    icon: <Check size={12} aria-hidden="true" />,
  },
  rejected: {
    chip: 'bg-[rgb(245_158_11/0.10)] text-[var(--color-status-amber)] ring-[rgb(245_158_11/0.26)]',
    icon: <X size={12} aria-hidden="true" />,
  },
  signature: {
    chip: 'bg-[rgb(167_139_250/0.10)] text-[var(--color-status-violet)] ring-[rgb(167_139_250/0.24)]',
    icon: <PenLine size={12} aria-hidden="true" />,
  },
  completed: {
    chip: 'bg-[rgb(16_185_129/0.18)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.4)]',
    icon: <CheckCheck size={12} aria-hidden="true" />,
  },
}

/**
 * Workflow and approvals.
 *
 * The example is the section. A five-word diagram of Upload → … → Archive is
 * true of every document system ever built; a supplier contract sitting on
 * Paul's desk since Tuesday morning, having already been sent back once by
 * Legal over the notice period, is what the feature actually feels like. The
 * rail above it exists to name the stages, not to carry the argument.
 *
 * The return trip is on purpose. A workflow visualisation that only ever shows
 * green ticks is describing a process nobody has. Legal sending it back — with
 * the reason, and the resubmission as v2 — is both the honest picture and the
 * best demonstration of why the decision needs to be recorded against a
 * version rather than against a file name.
 *
 * `availability` on every stage and state drives a "Coming soon" badge. All of
 * them are `live` today; the wiring stays so the page can be made accurate in
 * one word rather than one rewrite.
 */
export function Workflow() {
  const t = useT()
  const { ref, inView } = useInView<HTMLDivElement>('0px 0px -18% 0px')
  // Two beats: the pending approval resolves, then the outcome lands.
  const beat = useSequence(inView, 2, 900, 1600)

  const STAGES = stages(t)
  const STATES = states(t)
  const STEPS = steps(t)

  const resolved = beat >= 1
  const finished = beat >= 2

  return (
    <Section
      id="workflow"
      tone="raised"
      eyebrow={t.workflow.eyebrow}
      title={t.workflow.title}
      lead={t.workflow.lead}
    >
      {/* The stages, named. */}
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage, i) => (
          <Reveal key={stage.id} index={i} className="h-full">
            <li className="flex h-full flex-col rounded-xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.18)]">
                  {STAGE_ICON[stage.id]}
                </span>
                <h3 className="text-ui-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
                  {stage.name}
                </h3>
                <span className="ml-auto font-mono text-micro text-[var(--color-text-subtle)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <Badge availability={stage.availability} className="mt-2.5" />
              <p className="mt-2.5 text-ui leading-relaxed text-[var(--color-text-muted)]">
                {stage.blurb}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>

      {/* The example. */}
      <div ref={ref} className="mt-8">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] product-sheen">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-hairline)] px-4 py-3.5 sm:px-5">
            <h3 className="text-card font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              {t.workflow.exampleTitle}
            </h3>
            <span className="font-mono text-meta text-[var(--color-text-subtle)]">
              WF-2026-0341 · v2
            </span>
            <span className="ml-auto">
              <StatePill state={finished ? 'signature' : 'pending'} />
            </span>
          </div>

          <div className="px-4 py-4 sm:px-5">
            {/* The spine spans the steps only, and stops exactly where the
                outcome begins — the last step's bottom padding is the gap it
                has to cross. Each avatar is opaque and ringed in the surface
                colour, so the line disappears behind it rather than needing to
                be measured around it. */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-0 left-[1.09375rem] w-px bg-[var(--color-hairline)] sm:left-[1.1875rem]"
              />
              <ol>
                {STEPS.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    last={i === STEPS.length - 1}
                    resolved={resolved}
                  />
                ))}
              </ol>
            </div>

            {/* The outcome. Not a step, so not in the list — and present from
                the start, so the block never changes height. Only its
                treatment changes. */}
            <div className="flex gap-3 sm:gap-4">
              <span
                className={cn(
                  'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-[var(--color-surface)] transition-colors duration-700 sm:h-10 sm:w-10',
                  finished
                    ? 'bg-[var(--color-accent-600)] text-white'
                    : 'bg-[var(--color-ink-700)] text-[var(--color-text-subtle)]',
                )}
              >
                <CheckCheck size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <p
                  className={cn(
                    'text-ui-lg font-medium transition-colors duration-700',
                    finished ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]',
                  )}
                >
                  {t.workflow.approved}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-ui-sm transition-opacity duration-700',
                    finished ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <span className="text-[var(--color-text-muted)]">
                    {t.workflow.approvedNote}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-hairline)] px-4 py-3 sm:px-5">
            <p className="text-meta leading-relaxed text-[var(--color-text-subtle)]">
              {t.workflow.versionNote}
            </p>
          </div>
        </div>
      </div>

      {/* The states, as the product labels them. */}
      <div className="mt-10">
        <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
          {t.workflow.statesTitle}
        </h3>
        <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {STATES.map((s, i) => (
            <Reveal key={s.key} index={i % 3}>
              <li>
                <div className="flex flex-wrap items-center gap-2">
                  <StatePill state={s.key} label={s.label} />
                  <Badge availability={s.availability} />
                </div>
                <p className="mt-2 text-ui leading-relaxed text-[var(--color-text-muted)]">
                  {s.copy}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------- the step */

function decisionPill(t: Dict): Record<Decision, { key: StateKey; label: string }> {
  return {
    approved: { key: 'approved', label: t.workflow.states.approved.label },
    returned: { key: 'rejected', label: t.workflow.returned },
    pending: { key: 'pending', label: t.workflow.states.pending.label },
  }
}

function StepRow({ step, last, resolved }: { step: Step; last: boolean; resolved: boolean }) {
  const t = useT()
  // The last desk is the one that moves while you watch. Everything before it
  // is already history and stays put.
  const decision: Decision = last && resolved ? 'approved' : step.decision
  const pill = decisionPill(t)[decision]
  const settled = decision !== 'pending'

  return (
    <li className="relative flex gap-3 pb-6 sm:gap-4">
      <span
        className={cn(
          'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-meta font-medium ring-4 ring-[var(--color-surface)] transition-colors duration-700 sm:h-10 sm:w-10',
          settled
            ? 'bg-[rgb(16_185_129/0.14)] text-[var(--color-accent-400)]'
            : 'bg-[var(--color-ink-700)] text-[var(--color-text-muted)]',
        )}
      >
        {step.initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-ui-lg font-medium text-[var(--color-text)]">{step.party}</p>
          <p className="text-ui-sm text-[var(--color-text-subtle)]">{step.who}</p>
          <span className="ml-auto">
            <StatePill state={pill.key} label={pill.label} />
          </span>
        </div>

        <p className="mt-1 font-mono text-micro text-[var(--color-text-subtle)]">
          {last && resolved ? t.workflow.steps.management.resolvedAt : step.at}
        </p>

        <p className="mt-1.5 flex items-start gap-1.5 text-ui leading-relaxed text-[var(--color-text-muted)]">
          {step.decision === 'returned' && (
            <CornerUpLeft
              size={12}
              aria-hidden="true"
              className="mt-1 shrink-0 text-[var(--color-status-amber)]"
            />
          )}
          {step.note}
        </p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ bits */

function StatePill({ state, label }: { state: StateKey; label?: string }) {
  const t = useT()
  const style = STATE_STYLE[state]
  const text = label ?? states(t).find((s) => s.key === state)?.label ?? state
  return (
    <span
      key={state}
      className={cn(
        'motion-safe:animate-fade inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-meta whitespace-nowrap ring-1',
        style.chip,
      )}
    >
      {style.icon}
      {text}
    </span>
  )
}

/**
 * Renders nothing when the thing is available — which is the point. A badge
 * that has to be added later never is; a badge that has to be removed gets
 * removed the day the feature ships.
 */
function Badge({ availability, className }: { availability: Availability; className?: string }) {
  // Read before the early return: hooks cannot sit behind a condition.
  const t = useT()
  if (availability === 'live') return null
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border border-dashed border-[var(--color-hairline-strong)] px-2 py-0.5 text-micro text-[var(--color-text-subtle)]',
        className,
      )}
    >
      {t.common.comingSoon}
    </span>
  )
}
