import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, Check, FileText, FolderInput, RotateCcw, Search, Tag } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useTypewriter } from '@/lib/useTypewriter'
import { useT, type Dict } from '@/i18n'
import { PassportSheet } from './PassportSheet'

/** Milliseconds from the start of the run at which each step begins. */
const CUES = [150, 1200, 2800, 4500, 5900, 7500]

type Field = {
  label: string
  value: string
  confidence: 'high' | 'review'
  masked?: boolean
}

function fields(t: Dict): Field[] {
  return [
    { label: t.intelligence.fields.type.label, value: t.intelligence.fields.type.value, confidence: 'high' },
    { label: t.intelligence.fields.name.label, value: t.intelligence.fields.name.value, confidence: 'high' },
    {
      label: t.intelligence.fields.number.label,
      value: t.intelligence.fields.number.value,
      confidence: 'review',
      masked: true,
    },
    { label: t.intelligence.fields.expiry.label, value: t.intelligence.fields.expiry.value, confidence: 'high' },
  ]
}

/**
 * Document intelligence.
 *
 * The claim is narrow on purpose: KDB Doc Vault reads a document and proposes
 * structured fields. It does not pretend to be right every time — one of the
 * four fields comes back marked for review, and the panel says in plain words
 * that extraction is a suggestion someone confirms. Overstating this is both
 * dishonest and, on an identity document, the kind of thing that gets a
 * platform distrusted the first time it is wrong.
 *
 * No chat, no prompt box, no sparkles: the interface is a document on the left
 * and a record on the right, which is what the feature actually is.
 *
 * The run is tied to scroll position and can be replayed, so nothing important
 * is only visible to someone who happened to be looking.
 */
export function Intelligence() {
  const t = useT()
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(-1)
  const [complete, setComplete] = useState(false)

  const steps = t.intelligence.steps

  useEffect(() => {
    if (!inView) return

    if (reduced) {
      setStep(steps.length - 1)
      setComplete(true)
      return
    }

    setStep(-1)
    setComplete(false)

    const timers = CUES.map((at, i) =>
      window.setTimeout(() => {
        if (i === steps.length) setComplete(true)
        else setStep(i)
      }, at),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [inView, reduced, run, steps])

  const reached = (i: number) => step >= i

  // Memoised so the typewriter effect sees a stable identity. It compares its
  // phrases by reference, and a fresh literal would restart the typing on
  // every render.
  const queryPhrases = useMemo(() => [t.intelligence.query], [t])

  // Gated on the step, not just on motion preference: enabled from mount, the
  // typing would finish long before the search stage appears and the field
  // would simply pop in fully written.
  const query = useTypewriter(queryPhrases, {
    enabled: !reduced && step >= 4,
    loop: false,
    typeMs: 46,
  })

  return (
    <Section
      id="intelligence"
      tone="raised"
      eyebrow={t.intelligence.eyebrow}
      title={t.intelligence.title}
      lead={t.intelligence.lead}
    >
      <div ref={ref}>
        <StepBar step={step} complete={complete} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[19rem_1fr] lg:gap-10">
          {/* Left: the document as it arrives. */}
          <div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-hairline)] bg-black/25 px-3 py-2.5">
              <FileText size={14} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
              <span className="min-w-0 flex-1 truncate font-mono text-meta text-[var(--color-text-muted)]">
                passport.pdf
              </span>
              <span className="shrink-0 font-mono text-micro text-[var(--color-text-subtle)]">
                1.8 MB
              </span>
            </div>
            <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[var(--color-accent-600)] transition-[width] duration-[900ms] ease-[var(--ease-out-soft)]"
                style={{ width: reached(0) ? '100%' : '0%' }}
              />
            </div>

            <div className="mt-5">
              <PassportSheet detected={reached(2)} scanning={step === 1} />
            </div>

            <p className="mt-4 text-center text-meta text-[var(--color-text-subtle)]">
              {t.intelligence.ocrNote}
            </p>
          </div>

          {/* Right: what came out of it. */}
          <div className="min-w-0">
            <Panel>
              <PanelHead>
                <span>{t.intelligence.extracted}</span>
                <Appear when={reached(2)} delay={520}>
                  <span className="font-mono text-micro text-[var(--color-text-subtle)]">
                    {t.intelligence.found}
                  </span>
                </Appear>
              </PanelHead>

              <dl className="mt-1">
                {fields(t).map((f, i) => (
                  <Appear key={f.label} when={reached(2)} delay={i * 170}>
                    <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] py-2.5 last:border-b-0">
                      <dt className="w-32 shrink-0 text-meta text-[var(--color-text-subtle)] sm:w-40">
                        {f.label}
                      </dt>
                      <dd className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-ui text-[var(--color-text)]',
                            f.masked && 'font-mono tracking-[0.12em]',
                          )}
                        >
                          {f.value}
                        </span>
                        {f.masked && (
                          <span className="shrink-0 text-nano text-[var(--color-text-subtle)]">
                            {t.intelligence.masked}
                          </span>
                        )}
                        <Confidence level={f.confidence} />
                      </dd>
                    </div>
                  </Appear>
                ))}
              </dl>

              {/* The honesty line. It is not a disclaimer tucked into a footer:
                  it is the last thing you read in the panel that made the
                  claim. */}
              <Appear when={reached(2)} delay={760}>
                <p className="mt-3 border-t border-[var(--color-hairline)] pt-3 text-ui-sm leading-relaxed text-[var(--color-text-muted)]">
                  {t.intelligence.honesty}
                </p>
              </Appear>
            </Panel>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Appear when={reached(3)}>
                <Panel className="h-full">
                  <PanelHead>
                    <span>{t.intelligence.filed}</span>
                  </PanelHead>
                  <p className="mt-2 flex items-center gap-1.5 text-ui-sm text-[var(--color-text-muted)]">
                    <FolderInput size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
                    {t.intelligence.folder}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {t.intelligence.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-micro text-[var(--color-text-subtle)]"
                      >
                        <Tag size={10} aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--color-hairline)] pt-2.5 font-mono text-micro text-[var(--color-accent-400)]">
                    <Bell size={10} aria-hidden="true" />
                    {t.intelligence.rule}
                  </p>
                </Panel>
              </Appear>

              <Appear when={reached(4)}>
                <Panel className="h-full">
                  <PanelHead>
                    <span>{t.intelligence.findable}</span>
                  </PanelHead>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-black/30 px-2.5 py-1.5">
                    <Search size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
                    <span className="min-w-0 flex-1 truncate font-mono text-meta text-[var(--color-text-muted)]">
                      {reached(4) ? query : ''}
                      <span className="motion-safe:animate-caret ml-px inline-block h-3 w-px translate-y-0.5 bg-[var(--color-accent-400)]" />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg px-1 py-1.5">
                    <FileText size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
                    <span className="min-w-0 flex-1 truncate text-ui-sm text-[var(--color-text)]">
                      passport.pdf
                    </span>
                    <span className="shrink-0 font-mono text-micro text-[var(--color-status-amber)]">
                      2029
                    </span>
                  </div>
                  <p className="mt-1 border-t border-[var(--color-hairline)] pt-2.5 text-meta leading-snug text-[var(--color-text-subtle)]">
                    {t.intelligence.foundNote}
                  </p>
                </Panel>
              </Appear>
            </div>
          </div>
        </div>

        {!reduced && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-ui-sm text-[var(--color-text-subtle)] ring-1 ring-[var(--color-hairline)] transition-colors duration-[var(--duration-fast)] hover:bg-white/[0.04] hover:text-[var(--color-text)]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {t.intelligence.replay}
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ----------------------------------------------------------------- parts */

/**
 * Shows or hides without moving anything.
 *
 * The whole flow is rendered from the start and only its opacity changes.
 * Mounting each stage as it arrives would grow the block five times while the
 * visitor is reading it, shoving the rest of the page down each time.
 */
function Appear({
  when,
  delay = 0,
  className,
  children,
}: {
  when: boolean
  delay?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)]',
        when ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        className,
      )}
      style={{ transitionDelay: when ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

function PanelHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
      {children}
    </div>
  )
}

function Confidence({ level }: { level: 'high' | 'review' }) {
  const t = useT()
  const review = level === 'review'
  return (
    <span
      className={cn(
        'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-nano whitespace-nowrap ring-1',
        review
          ? 'bg-[rgb(245_158_11/0.10)] text-[var(--color-status-amber)] ring-[rgb(245_158_11/0.22)]'
          : 'bg-[rgb(16_185_129/0.08)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.20)]',
      )}
    >
      {review ? t.intelligence.needsReview : t.intelligence.confident}
    </span>
  )
}

function StepBar({ step, complete }: { step: number; complete: boolean }) {
  const t = useT()
  const steps = t.intelligence.steps

  return (
    <ol className="flex items-start" aria-label={t.intelligence.stepsLabel}>
      {steps.map((name, i) => {
        const done = complete || step > i
        const current = !complete && step === i
        return (
          <li key={name} className="flex min-w-0 flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span className="relative grid h-6 w-6 shrink-0 place-items-center">
                {current && (
                  <span
                    aria-hidden="true"
                    className="motion-safe:animate-ping-ring absolute h-2.5 w-2.5 rounded-full bg-[var(--color-accent-400)]"
                  />
                )}
                <span
                  className={cn(
                    'relative grid h-6 w-6 place-items-center rounded-full text-nano ring-1 transition-colors duration-500',
                    done && 'bg-[rgb(16_185_129/0.14)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.35)]',
                    current && 'bg-[var(--color-accent-600)] text-white ring-[rgb(16_185_129/0.5)]',
                    !done && !current && 'bg-white/[0.03] text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
                  )}
                >
                  {done ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>
              </span>

              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-px flex-1 transition-colors duration-500',
                    done ? 'bg-[rgb(16_185_129/0.35)]' : 'bg-[var(--color-hairline)]',
                  )}
                />
              )}
            </div>

            <span
              className={cn(
                'mt-2 w-full truncate pr-2 text-micro transition-colors duration-500 sm:text-ui-sm',
                current || done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]',
                i === steps.length - 1 && 'pr-0 text-right',
              )}
            >
              {name}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
