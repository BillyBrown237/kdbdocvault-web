import type { ReactNode } from 'react'
import { Bell, Check, Tag } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'
import { useSequence } from '@/lib/useSequence'

const MODEL = ['Upload', 'Understand', 'Manage', 'Automate'] as const

const STEPS = [
  { n: '01', name: 'Upload', copy: 'Bring in your document.' },
  { n: '02', name: 'Organize', copy: 'Categorize, tag, and enrich it.' },
  { n: '03', name: 'Manage', copy: 'Share, approve, sign, track, and collaborate.' },
  {
    n: '04',
    name: 'Automate',
    copy: 'Let reminders, workflows, and document intelligence handle repetitive work.',
  },
] as const

/**
 * How it works.
 *
 * This section's job is to be the quiet one. Everything around it is dense —
 * dashboards, audit trails, permission matrices — and a visitor who has been
 * reading interfaces for two minutes needs somewhere to stand back and see the
 * shape of the thing. So: four short lines, no tables, no mono microtext, more
 * air than anything else on the page. The restraint is the feature.
 *
 * The same document appears in all four cards with the same name and the same
 * page. Only what surrounds it changes — a tag, then a signature, then a
 * reminder. Read left to right, that accumulation is the argument: nothing new
 * is asked of the visitor at any step, the document simply gains context it
 * did not have before.
 */
export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>('0px 0px -25% 0px')
  const reached = useSequence(inView, MODEL.length, 260, 150)

  return (
    <Section
      id="how"
      tone="seam"
      eyebrow="How it works"
      title="From file to managed document."
      lead="Everything else on this page happens inside these four steps."
    >
      {/* The whole idea in four words, before any of the detail. */}
      <div ref={ref} className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
        {MODEL.map((word, i) => (
          <span key={word} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'text-[var(--color-text-subtle)] transition-opacity duration-500',
                  reached > i ? 'opacity-100' : 'opacity-0',
                )}
              >
                →
              </span>
            )}
            <span
              className={cn(
                'text-h3 font-semibold tracking-[-0.02em] transition-colors duration-500',
                reached > i ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]',
              )}
            >
              {word}
            </span>
          </span>
        ))}
      </div>

      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} index={i} className="h-full">
            <li className="flex h-full flex-col rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
              <p className="font-mono text-ui-sm text-[var(--color-accent-400)]">{step.n}</p>
              <h3 className="mt-3 text-h3 leading-tight font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                {step.name}
              </h3>
              <p className="mt-2.5 text-ui-lg leading-relaxed text-[var(--color-text-muted)]">
                {step.copy}
              </p>
              <div className="mt-6">
                <DocumentAt stage={i} />
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}

/**
 * The same document at each stage.
 *
 * The page and the filename never change — that is what makes it read as one
 * document travelling rather than four documents illustrating four features.
 * Each stage adds exactly one thing, and no stage explains itself.
 */
function DocumentAt({ stage }: { stage: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
      <div className="flex items-center gap-2.5">
        <Page />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-ui-sm text-[var(--color-text)]">
            contract.pdf
          </span>
          <span className="block font-mono text-nano text-[var(--color-text-subtle)]">
            412 KB
          </span>
        </span>
      </div>

      {stage >= 1 && (
        <Added>
          <span className="flex flex-wrap gap-1">
            {['contract', '2026'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-nano text-[var(--color-text-subtle)]"
              >
                <Tag size={10} aria-hidden="true" />
                {t}
              </span>
            ))}
          </span>
        </Added>
      )}

      {stage >= 2 && (
        <Added>
          <span className="flex items-center gap-2">
            <span className="flex -space-x-1.5">
              {['MN', 'PE'].map((a) => (
                <span
                  key={a}
                  className="grid h-4 w-4 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano text-[var(--color-text-muted)] ring-2 ring-[var(--color-ink-800)]"
                >
                  {a}
                </span>
              ))}
            </span>
            <span className="inline-flex items-center gap-1 text-nano text-[var(--color-accent-400)]">
              <Check size={10} aria-hidden="true" />
              Signed
            </span>
          </span>
        </Added>
      )}

      {stage >= 3 && (
        <Added>
          <span className="inline-flex items-center gap-1.5 text-nano text-[var(--color-status-amber)]">
            <Bell size={10} aria-hidden="true" />
            Renews in 12 months
          </span>
        </Added>
      )}
    </div>
  )
}

/** A line the document did not have at the previous step. */
function Added({ children }: { children: ReactNode }) {
  return <div className="mt-2 border-t border-[var(--color-hairline)] pt-2">{children}</div>
}

/** A page. Small, light, and identical in all four cards. */
function Page() {
  return (
    <span className="grid h-9 w-7 shrink-0 gap-[3px] rounded-sm bg-[#E9EEF5] p-1.5 content-start">
      {[100, 70, 90, 55].map((w, i) => (
        <span
          key={i}
          className="h-[2px] rounded-full bg-[#B9C5D4]"
          style={{ width: `${w}%` }}
        />
      ))}
    </span>
  )
}
