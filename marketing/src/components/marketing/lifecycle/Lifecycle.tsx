import { ArrowRight, Building2, Car, ClipboardCheck, FileText, Mail, Plane, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'
import { REGISTER_URL } from '@/lib/links'
import {
  countdown,
  dateIn,
  DOCS,
  LADDER,
  positionOf,
  REMINDERS,
  STOPS,
  urgencyOf,
  type Doc,
  type Reminder,
  type Urgency,
} from './lifecycle'

/** One grid definition, used by the axis header and every row beneath it. */
const ROW = 'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 sm:grid-cols-[13rem_1fr_8.5rem]'

const URGENCY: Record<Urgency, { bar: string; dot: string; chip: string }> = {
  ok: {
    bar: 'bg-[var(--color-accent-600)]',
    dot: 'bg-[var(--color-accent-400)]',
    chip: 'bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.22)]',
  },
  soon: {
    bar: 'bg-[linear-gradient(90deg,var(--color-accent-600),var(--color-status-amber))]',
    dot: 'bg-[var(--color-status-amber)]',
    chip: 'bg-[rgb(245_158_11/0.10)] text-[var(--color-status-amber)] ring-[rgb(245_158_11/0.22)]',
  },
  urgent: {
    bar: 'bg-[linear-gradient(90deg,var(--color-accent-600),var(--color-status-amber))]',
    dot: 'bg-[var(--color-status-amber)]',
    chip: 'bg-[rgb(245_158_11/0.16)] text-[var(--color-status-amber)] ring-[rgb(245_158_11/0.4)]',
  },
}

const DOC_ICON = {
  passport: Plane,
  insurance: Car,
  licence: Building2,
  contract: FileText,
} as const

const REMINDER_ICON = {
  email: Mail,
  push: Smartphone,
  task: ClipboardCheck,
  scheduled: FileText,
} as const

/**
 * Document lifecycle management.
 *
 * The board and the timeline are the same object. Rather than showing a list
 * of documents and, separately, a diagram of 90/30/7/1/Expired, every document
 * is plotted against that axis — so four rows are enough to see that the
 * passport has room, the licence does not, and the contract is out of time.
 * A dashboard that only lists dates is a spreadsheet; one that shows distance
 * to a deadline is the argument for the product.
 *
 * The axis is evenly spaced rather than linear on purpose: the thresholds that
 * matter are 90, 30, 7 and 1, and on a true time scale the last three would
 * collapse into the final centimetre of the bar.
 *
 * No statistics. The section never claims a reduction in missed deadlines,
 * because there is no honest number to put there — it shows the mechanism and
 * lets it speak.
 */
export function Lifecycle() {
  const { ref, inView } = useInView<HTMLDivElement>('0px 0px -18% 0px')

  return (
    <Section
      id="lifecycle"
      tone="page"
      eyebrow="Lifecycle"
      title="Never discover an expired document too late."
      lead="KDB Doc Vault keeps important dates attached to the documents they belong to and helps you act before deadlines become problems."
    >
      <div ref={ref}>
        <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] product-sheen">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--color-hairline)] px-4 py-3.5 sm:px-5">
            <h3 className="text-card font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              Renewals &amp; expiries
            </h3>
            <p className="font-mono text-meta text-[var(--color-text-subtle)]">
              4 documents · 1 due tomorrow
            </p>
          </div>

          <div className="px-4 py-4 sm:px-5">
            {/* The shared scale, drawn once. Every row below reads against it. */}
            <div className={cn(ROW, 'hidden sm:grid')} aria-hidden="true">
              <span />
              <div className="relative h-4">
                {STOPS.map((stop, i) => (
                  <span
                    key={stop}
                    className={cn(
                      'absolute top-0 font-mono text-micro text-[var(--color-text-subtle)]',
                      i === 0 && 'left-0',
                      i > 0 && i < STOPS.length - 1 && '-translate-x-1/2',
                      i === STOPS.length - 1 && '-translate-x-full',
                    )}
                    style={{ left: i === 0 ? undefined : `${(i / (STOPS.length - 1)) * 100}%` }}
                  >
                    {stop === 0 ? 'Expired' : `${stop}d`}
                  </span>
                ))}
              </div>
              <span />
            </div>

            <ul className="mt-1 divide-y divide-[var(--color-hairline)]">
              {DOCS.map((doc, i) => (
                <Row key={doc.id} doc={doc} index={i} started={inView} />
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <div className="h-full rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
              <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
                What happens as the date approaches
              </h3>
              <ol className="relative mt-4">
                <span
                  aria-hidden="true"
                  className="absolute top-2 bottom-2 left-[0.3125rem] w-px bg-[linear-gradient(180deg,rgb(16_185_129/0.4),rgb(245_158_11/0.4))]"
                />
                {LADDER.map((rung, i) => (
                  <li key={rung.at} className="relative pb-4 pl-7 last:pb-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-card)]',
                        i < 2 ? 'bg-[var(--color-accent-500)]' : 'bg-[var(--color-status-amber)]',
                      )}
                    />
                    <p className="font-mono text-meta text-[var(--color-text)]">{rung.at}</p>
                    <p className="mt-1 text-ui leading-relaxed text-[var(--color-text-muted)]">
                      {rung.action}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
            <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
              Reminders sent
            </h3>
            <ul className="mt-4 space-y-2.5">
              {REMINDERS.map((r, i) => (
                // The last card is delayed well past the others so it reads as
                // one that arrived while you were looking, rather than part of
                // the same batch.
                <li key={r.id}>
                  <Reveal index={i < REMINDERS.length - 1 ? i : 14}>
                    <ReminderCard reminder={r} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-h3 font-semibold tracking-[-0.02em] text-[var(--color-text)]">
            Stay ahead of your documents
          </p>
          <p className="max-w-md text-sm text-[var(--color-text-subtle)]">
            Add a date to any document. KDB Doc Vault carries it from there.
          </p>
          {/* Secondary, not primary: the page has exactly two emerald buttons,
              in the hero and in the closing block. A third mid-page would make
              all three read as ordinary. */}
          <Button
            href={REGISTER_URL}
            variant="secondary"
            size="md"
            className="mt-1"
            trailing={<ArrowRight size={16} aria-hidden="true" />}
          >
            Get started
          </Button>
        </div>
      </div>
    </Section>
  )
}

function Row({ doc, index, started }: { doc: Doc; index: number; started: boolean }) {
  const urgency = urgencyOf(doc.days)
  const tone = URGENCY[urgency]
  const Icon = DOC_ICON[doc.icon]
  const position = positionOf(doc.days)

  return (
    <li className={cn(ROW, 'py-3.5')}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-[var(--color-hairline)]">
          <Icon size={14} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-ui font-medium text-[var(--color-text)]">
            {doc.name}
          </span>
          <span className="block truncate text-meta text-[var(--color-text-subtle)]">
            {doc.detail} · {doc.owner}
          </span>
        </span>
      </div>

      {/* On a phone the track drops to its own full-width line beneath the
          name and the countdown, rather than being squeezed between them. */}
      <div className="order-last col-span-2 sm:order-none sm:col-span-1">
        <div className="relative h-1.5 rounded-full bg-white/[0.05]">
          {[1, 2, 3].map((t) => (
            <span
              key={t}
              aria-hidden="true"
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-[var(--color-hairline-strong)]"
              style={{ left: `${(t / (STOPS.length - 1)) * 100}%` }}
            />
          ))}

          {/* One transition on width carries the marker to its place: the dot
              rides the segment's right edge, so nothing has to be animated
              twice or kept in sync. */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-[width] duration-[1100ms] ease-[var(--ease-out-soft)]',
              tone.bar,
            )}
            style={{
              width: started ? `${position}%` : '0%',
              transitionDelay: `${index * 130}ms`,
            }}
          >
            <span className="absolute top-1/2 right-0 grid -translate-y-1/2 translate-x-1/2 place-items-center">
              {urgency === 'urgent' && (
                <span
                  aria-hidden="true"
                  className="motion-safe:animate-ping-ring absolute h-2.5 w-2.5 rounded-full bg-[var(--color-status-amber)]"
                />
              )}
              <span
                className={cn(
                  'relative h-3 w-3 rounded-full ring-2 ring-[var(--color-surface)]',
                  tone.dot,
                )}
              />
            </span>
          </div>
        </div>
      </div>

      <div className="justify-self-end text-right">
        <span
          className={cn(
            'inline-block rounded-full px-2 py-0.5 text-meta whitespace-nowrap ring-1',
            tone.chip,
          )}
        >
          {countdown(doc.days)}
        </span>
        {/* Derived from today's date, so the prerendered value and the one
            the browser computes differ by however long the build has been
            live. The client value is the correct one; React is told not to
            warn about replacing it. */}
        <span
          suppressHydrationWarning
          className="mt-1 block font-mono text-micro text-[var(--color-text-subtle)]"
        >
          {dateIn(doc.days)}
        </span>
      </div>
    </li>
  )
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const Icon = REMINDER_ICON[reminder.kind]
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3 transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-hairline-strong)]">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.18)]">
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 text-ui leading-snug text-[var(--color-text)]">
          <span className="min-w-0 flex-1">{reminder.title}</span>
          <span className="shrink-0 font-mono text-nano whitespace-nowrap text-[var(--color-text-subtle)]">
            {reminder.at}
          </span>
        </p>
        <p suppressHydrationWarning className="mt-0.5 text-meta text-[var(--color-text-subtle)]">
          {reminder.meta}
        </p>
      </div>
    </div>
  )
}
