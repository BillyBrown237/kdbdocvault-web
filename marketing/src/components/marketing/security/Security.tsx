import type { ReactNode } from 'react'
import {
  Check,
  Database,
  FileText,
  KeyRound,
  Layers,
  Link2,
  Lock,
  ScrollText,
  SlidersHorizontal,
  Timer,
  UserRound,
  Users,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'
import { useSequence } from '@/lib/useSequence'
import { useT, type Dict } from '@/i18n'

/**
 * Security, explained rather than asserted.
 *
 * The words this section is not allowed to use are as much a part of the brief
 * as the ones it is: no "military-grade", no "bank-level", no "unbreakable".
 * None of those are standards — they are adjectives, and a reader who knows
 * that treats the whole page as marketing. So the section states mechanisms
 * instead, each in one plain sentence, and says out loud that it is doing so.
 *
 * The architecture is drawn as six checkpoints a single request has to pass.
 * Each one carries two registers: a question in ordinary language ("Are you
 * allowed to do this?") for the visitor who wants the idea, and the artefact
 * underneath it for the visitor who wants the detail. Neither reader is asked
 * to read the other's half.
 */

type Stage = {
  name: string
  question: string
  plain: string
  icon: ReactNode
  artifact: ReactNode
}

function stages(t: Dict): Stage[] {
  return [
    {
      name: t.security.stages.user.name,
      question: t.security.stages.user.question,
      plain: t.security.stages.user.plain,
      icon: <UserRound size={14} aria-hidden="true" />,
      artifact: (
        <Artifact>
          <Line>{t.security.stages.user.line}</Line>
          <Faint>{t.security.stages.user.faint}</Faint>
        </Artifact>
      ),
    },
    {
      name: t.security.stages.auth.name,
      question: t.security.stages.auth.question,
      plain: t.security.stages.auth.plain,
      icon: <KeyRound size={14} aria-hidden="true" />,
      artifact: (
        <Artifact>
          <Line>{t.security.stages.auth.line}</Line>
          <Faint>{t.security.stages.auth.faint}</Faint>
        </Artifact>
      ),
    },
    {
      name: t.security.stages.authz.name,
      question: t.security.stages.authz.question,
      plain: t.security.stages.authz.plain,
      icon: <SlidersHorizontal size={14} aria-hidden="true" />,
      artifact: (
        <Artifact>
          <Line>
            {t.security.stages.authz.lineBefore}
            <Em>documents:read</Em>
            {t.security.stages.authz.lineMiddle}
            <Em>member</Em>
          </Line>
          <Faint>{t.security.stages.authz.faint}</Faint>
        </Artifact>
      ),
    },
    {
      name: t.security.stages.tenant.name,
      question: t.security.stages.tenant.question,
      plain: t.security.stages.tenant.plain,
      icon: <Layers size={14} aria-hidden="true" />,
      artifact: (
        <Artifact accent>
          <Line>
            {t.security.stages.tenant.lineBefore}
            <Em>019f4470-45e0-…</Em>
            {t.security.stages.tenant.lineAfter}
          </Line>
          <Faint>{t.security.stages.tenant.faint}</Faint>
        </Artifact>
      ),
    },
    {
      name: t.security.stages.document.name,
      question: t.security.stages.document.question,
      plain: t.security.stages.document.plain,
      icon: <FileText size={14} aria-hidden="true" />,
      artifact: (
        <Artifact>
          <Line>{t.security.stages.document.line}</Line>
          <Faint>{t.security.stages.document.faint}</Faint>
        </Artifact>
      ),
    },
    {
      name: t.security.stages.audit.name,
      question: t.security.stages.audit.question,
      plain: t.security.stages.audit.plain,
      icon: <ScrollText size={14} aria-hidden="true" />,
      artifact: (
        <Artifact accent>
          <Line>{t.security.stages.audit.line}</Line>
          <Faint>{t.security.stages.audit.faint}</Faint>
        </Artifact>
      ),
    },
  ]
}

function concepts(t: Dict) {
  return [
    {
      name: t.security.concepts.tenant.name,
      icon: <Layers size={14} aria-hidden="true" />,
      copy: t.security.concepts.tenant.copy,
    },
    {
      name: t.security.concepts.roles.name,
      icon: <Users size={14} aria-hidden="true" />,
      copy: t.security.concepts.roles.copy,
    },
    {
      name: t.security.concepts.encryption.name,
      icon: <Lock size={14} aria-hidden="true" />,
      copy: t.security.concepts.encryption.copy,
    },
    {
      name: t.security.concepts.audit.name,
      icon: <ScrollText size={14} aria-hidden="true" />,
      copy: t.security.concepts.audit.copy,
    },
    {
      name: t.security.concepts.sharing.name,
      icon: <Link2 size={14} aria-hidden="true" />,
      copy: t.security.concepts.sharing.copy,
    },
    {
      name: t.security.concepts.versions.name,
      icon: <Database size={14} aria-hidden="true" />,
      copy: t.security.concepts.versions.copy,
    },
    {
      name: t.security.concepts.access.name,
      icon: <SlidersHorizontal size={14} aria-hidden="true" />,
      copy: t.security.concepts.access.copy,
    },
    {
      name: t.security.concepts.retention.name,
      icon: <Timer size={14} aria-hidden="true" />,
      copy: t.security.concepts.retention.copy,
    },
  ]
}

export function Security() {
  const t = useT()
  const { ref, inView } = useInView<HTMLDivElement>('0px 0px -20% 0px')
  const STAGES = stages(t)
  const CONCEPTS = concepts(t)
  const reached = useSequence(inView, STAGES.length, 380)

  return (
    <Section
      id="security"
      // `page`, because Sharing above it is `raised` — see the tone note in
      // Home.tsx. Two raised sections in a row lose the seam between them.
      tone="page"
      eyebrow={t.security.eyebrow}
      title={t.security.title}
      lead={t.security.lead}
    >
      {/* Said plainly and early, because a reader who has met those phrases
          before discounts everything that follows them. */}
      <p className="-mt-8 mb-12 max-w-2xl border-l-2 border-[var(--color-hairline-strong)] pl-4 text-ui leading-relaxed text-[var(--color-text-subtle)]">
        {t.security.disclaimerBefore}
        <em className="not-italic text-[var(--color-text-muted)]">{t.security.disclaimerWords[0]}</em>,{' '}
        <em className="not-italic text-[var(--color-text-muted)]">{t.security.disclaimerWords[1]}</em>
        {t.security.disclaimerOr}
        <em className="not-italic text-[var(--color-text-muted)]">{t.security.disclaimerWords[2]}</em>
        {t.security.disclaimerAfter}
      </p>

      <div ref={ref}>
        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-[0.9375rem] w-px bg-[var(--color-hairline)] sm:left-[1.1875rem]"
          />
          {/* The lit portion of the spine grows as the request descends. */}
          <span
            aria-hidden="true"
            className="absolute top-4 left-[0.9375rem] w-px bg-[var(--color-accent-500)]/60 transition-[height] duration-500 ease-[var(--ease-out-soft)] sm:left-[1.1875rem]"
            style={{ height: `calc((100% - 2rem) * ${reached / STAGES.length})` }}
          />

          {STAGES.map((stage, i) => {
            const on = reached > i
            return (
              <li key={stage.name} className="relative flex gap-4 pb-6 last:pb-0 sm:gap-5">
                <span
                  className={cn(
                    'relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 transition-colors duration-500 sm:h-10 sm:w-10',
                    on
                      ? 'bg-[rgb(16_185_129/0.12)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.35)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
                  )}
                >
                  {stage.icon}
                </span>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-card font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                      {stage.name}
                    </h3>
                    <p className="text-ui text-[var(--color-text-subtle)]">
                      {stage.question}
                    </p>
                    <span
                      className={cn(
                        'ml-auto shrink-0 transition-opacity duration-500',
                        on ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <Check size={14} aria-hidden="true" className="text-[var(--color-accent-400)]" />
                    </span>
                  </div>

                  <p className="mt-1.5 max-w-2xl text-ui-lg leading-relaxed text-[var(--color-text-muted)]">
                    {stage.plain}
                  </p>

                  <div
                    className={cn(
                      'mt-3 transition-opacity duration-700',
                      on ? 'opacity-100' : 'opacity-40',
                    )}
                  >
                    {stage.artifact}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-14">
        <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
          {t.security.restTitle}
        </h3>
        <dl className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {CONCEPTS.map((c, i) => (
            <Reveal key={c.name} index={i % 2}>
              <div>
                <dt className="flex items-center gap-2 text-ui-lg font-medium text-[var(--color-text)]">
                  <span className="text-[var(--color-accent-400)]">{c.icon}</span>
                  {c.name}
                </dt>
                <dd className="mt-1.5 text-ui leading-relaxed text-[var(--color-text-muted)]">
                  {c.copy}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------- artefacts */

function Artifact({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-black/25 px-3 py-2',
        accent ? 'border-[rgb(16_185_129/0.25)]' : 'border-[var(--color-hairline)]',
      )}
    >
      {children}
    </div>
  )
}

function Line({ children }: { children: ReactNode }) {
  return (
    <p className="truncate font-mono text-meta text-[var(--color-text-muted)]">{children}</p>
  )
}

function Faint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-meta text-[var(--color-text-subtle)]">{children}</p>
}

function Em({ children }: { children: ReactNode }) {
  return <span className="text-[var(--color-accent-400)]">{children}</span>
}
