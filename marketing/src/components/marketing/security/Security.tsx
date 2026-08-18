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

const STAGES: Stage[] = [
  {
    name: 'User',
    question: 'Who is asking?',
    plain: 'A request arrives from a person on a device — nothing is trusted about it yet.',
    icon: <UserRound size={14} aria-hidden="true" />,
    artifact: (
      <Artifact>
        <Line>GET /documents/019f…c41/content</Line>
        <Faint>from a browser session · no assumptions made</Faint>
      </Artifact>
    ),
  },
  {
    name: 'Authentication',
    question: 'Are you who you say you are?',
    plain: 'The sign-in is verified and turned into a session with a limited lifetime.',
    icon: <KeyRound size={14} aria-hidden="true" />,
    artifact: (
      <Artifact>
        <Line>session · issued 09:14 · expires 21:14</Line>
        <Faint>expired or revoked sessions stop here</Faint>
      </Artifact>
    ),
  },
  {
    name: 'Authorization',
    question: 'Are you allowed to do this, to this document?',
    plain: 'The action is checked against the role you hold and the rules on that document.',
    icon: <SlidersHorizontal size={14} aria-hidden="true" />,
    artifact: (
      <Artifact>
        <Line>
          requires <Em>documents:read</Em> · role <Em>member</Em>
        </Line>
        <Faint>the answer is per action, not per login</Faint>
      </Artifact>
    ),
  },
  {
    name: 'Tenant isolation',
    question: 'Whose data can you even see?',
    plain:
      'Your organization’s rows are separated by the database itself, underneath every query the application writes.',
    icon: <Layers size={14} aria-hidden="true" />,
    artifact: (
      <Artifact accent>
        <Line>
          tenant = <Em>019f4470-45e0-…</Em> · set by the server
        </Line>
        <Faint>a mistake in the application still cannot return another organization&rsquo;s row</Faint>
      </Artifact>
    ),
  },
  {
    name: 'Document',
    question: 'What actually comes back?',
    plain: 'The file is served from encrypted storage, through a link that expires in minutes.',
    icon: <FileText size={14} aria-hidden="true" />,
    artifact: (
      <Artifact>
        <Line>object key · opaque · encrypted at rest</Line>
        <Faint>the storage path reveals nothing about the document</Faint>
      </Artifact>
    ),
  },
  {
    name: 'Audit trail',
    question: 'What was written down?',
    plain: 'The action becomes an entry: who, what, when. Entries are appended, never edited.',
    icon: <ScrollText size={14} aria-hidden="true" />,
    artifact: (
      <Artifact accent>
        <Line>+ viewed · marie@… · 09:41 · v4</Line>
        <Faint>appended — see the trail below</Faint>
      </Artifact>
    ),
  },
]

const CONCEPTS = [
  {
    name: 'Tenant isolation',
    icon: <Layers size={14} aria-hidden="true" />,
    copy: 'Every row belongs to one organization, and the database enforces that on every query. Another tenant’s data is not hidden from you — it is unreachable.',
  },
  {
    name: 'Role-based access',
    icon: <Users size={14} aria-hidden="true" />,
    copy: 'Owner, admin, member. What a person can do follows the role they hold, not the link somebody forwarded them.',
  },
  {
    name: 'Encryption',
    icon: <Lock size={14} aria-hidden="true" />,
    copy: 'Documents are encrypted in transit and at rest. Object keys are opaque, so a storage path gives nothing away about what it holds.',
  },
  {
    name: 'Audit trails',
    icon: <ScrollText size={14} aria-hidden="true" />,
    copy: 'Every action that changes a document adds an entry. Entries are appended — the application offers no way to edit or remove one.',
  },
  {
    name: 'Secure sharing',
    icon: <Link2 size={14} aria-hidden="true" />,
    copy: 'A link carries its own rules: an expiry date, a view limit, an optional password. It can be revoked, and revoking it is immediate.',
  },
  {
    name: 'Version integrity',
    icon: <Database size={14} aria-hidden="true" />,
    copy: 'A new version never overwrites the old one. Each is stored separately and stays retrievable, so “the current one” is a fact rather than a convention.',
  },
  {
    name: 'Access controls',
    icon: <SlidersHorizontal size={14} aria-hidden="true" />,
    copy: 'View, download, share and delete are granted separately, per document and per folder — not bundled into one permission called “access”.',
  },
  {
    name: 'Document retention',
    icon: <Timer size={14} aria-hidden="true" />,
    copy: 'A retention rule blocks deletion until it lapses. A legal hold blocks it regardless of the rule, and both are recorded.',
  },
]

export function Security() {
  const { ref, inView } = useInView<HTMLDivElement>('0px 0px -20% 0px')
  const reached = useSequence(inView, STAGES.length, 380)

  return (
    <Section
      id="security"
      // `page`, because Sharing above it is `raised` — see the tone note in
      // Home.tsx. Two raised sections in a row lose the seam between them.
      tone="page"
      eyebrow="Security"
      title="Built for documents you wouldn't want in the wrong hands."
      lead="Every request for a document passes the same six checkpoints, in the same order, every time. Here is what each one actually does."
    >
      {/* Said plainly and early, because a reader who has met those phrases
          before discounts everything that follows them. */}
      <p className="-mt-8 mb-12 max-w-2xl border-l-2 border-[var(--color-hairline-strong)] pl-4 text-ui leading-relaxed text-[var(--color-text-subtle)]">
        You won&rsquo;t find <em className="not-italic text-[var(--color-text-muted)]">military-grade</em>,{' '}
        <em className="not-italic text-[var(--color-text-muted)]">bank-level</em> or{' '}
        <em className="not-italic text-[var(--color-text-muted)]">unbreakable</em> anywhere on this
        page. None of those are standards. What follows are mechanisms you can check.
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
          The rest of it, in plain words
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
