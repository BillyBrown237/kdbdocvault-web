import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronDown,
  Download,
  Filter,
  Layers,
  Link2,
  Lock,
  PenLine,
  Scale,
  Share2,
  UploadCloud,
  UserRoundX,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'

type Entry = {
  id: string
  time: string
  action: string
  actor: string
  role: string
  icon: ReactNode
  detail: { label: string; value: string }[]
}

const ENTRIES: Entry[] = [
  {
    id: 'upload',
    time: '10:42 AM',
    action: 'Document uploaded',
    actor: 'Marie Ndongo',
    role: 'Owner',
    icon: <UploadCloud size={14} aria-hidden="true" />,
    detail: [
      { label: 'Version', value: 'v1 · 412 KB · PDF' },
      { label: 'Folder', value: 'Contracts / Active' },
      { label: 'Origin', value: 'Web · Douala' },
    ],
  },
  {
    id: 'review',
    time: '11:03 AM',
    action: 'Legal reviewed',
    actor: 'Aïcha Bello',
    role: 'Reviewer',
    icon: <Scale size={14} aria-hidden="true" />,
    detail: [
      { label: 'Outcome', value: 'Review completed · 2 comments left' },
      { label: 'On version', value: 'v1' },
      { label: 'Requested by', value: 'Marie Ndongo · 10:44 AM' },
    ],
  },
  {
    id: 'approve',
    time: '11:17 AM',
    action: 'Manager approved',
    actor: 'Paul Ekani',
    role: 'Approver',
    icon: <PenLine size={14} aria-hidden="true" />,
    detail: [
      { label: 'Step', value: 'Approval 2 of 2 — workflow complete' },
      { label: 'On version', value: 'v1' },
      { label: 'Note', value: '“Approved subject to the amended notice period.”' },
    ],
  },
  {
    id: 'share',
    time: '11:19 AM',
    action: 'Document shared',
    actor: 'Marie Ndongo',
    role: 'Owner',
    icon: <Share2 size={14} aria-hidden="true" />,
    detail: [
      { label: 'With', value: 'External counsel · secure link' },
      { label: 'Rules', value: 'View only · expires in 7 days · password required' },
      { label: 'Used', value: '2 of 5 views' },
    ],
  },
  {
    id: 'v2',
    time: '11:25 AM',
    action: 'Version 2 created',
    actor: 'Marie Ndongo',
    role: 'Owner',
    icon: <Layers size={14} aria-hidden="true" />,
    detail: [
      { label: 'Change', value: 'v1 → v2 · notice period raised to 90 days' },
      { label: 'Previous', value: 'v1 kept and still retrievable' },
      { label: 'Notified', value: 'Legal, Finance' },
    ],
  },
]

const REASONS = [
  {
    icon: <Scale size={14} aria-hidden="true" />,
    title: 'When there is a disagreement',
    copy: 'Who approved it, on which version, and at what time stops being someone’s recollection. It is a record with a timestamp next to it.',
  },
  {
    icon: <Download size={14} aria-hidden="true" />,
    title: 'When you are audited',
    copy: 'Export the history of a document, a folder, or a date range. Nobody has to reconstruct a year from memory and an inbox.',
  },
  {
    icon: <UserRoundX size={14} aria-hidden="true" />,
    title: 'When someone leaves',
    copy: 'The trail belongs to the document, not to the person who handled it. A handover does not depend on what was in one mailbox.',
  },
]

/**
 * Auditability.
 *
 * The pairing with the security section is deliberate: security is about what
 * cannot happen, auditability is about being able to prove what did. The
 * second is the one an organization is usually asked for — by a partner, an
 * auditor, or a lawyer — and it is the harder of the two to add afterwards.
 *
 * The timeline is a disclosure list, not decoration: each entry expands to the
 * detail actually recorded against it, one at a time, driven by real buttons
 * with `aria-expanded`. Presenting an audit trail as something you cannot open
 * would rather undercut the argument.
 */
export function Auditability() {
  const [openId, setOpenId] = useState<string>('share')

  return (
    <Section
      id="audit"
      tone="seam"
      eyebrow="Auditability"
      title="Know what happened. Not just where the file is."
      lead="Every important document action can become part of a traceable history — attached to the document, kept for as long as the document is."
    >
      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] lg:gap-8">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] product-sheen">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-hairline)] px-4 py-3.5 sm:px-5">
            <h3 className="text-ui-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              Audit trail
            </h3>
            <span className="font-mono text-meta text-[var(--color-text-subtle)]">
              Contract.pdf
            </span>
            <div aria-hidden="true" className="ml-auto flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-micro text-[var(--color-text-subtle)] ring-1 ring-[var(--color-hairline)]">
                <Filter size={10} />
                All actions
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-micro text-[var(--color-text-subtle)] ring-1 ring-[var(--color-hairline)]">
                <Download size={10} />
                Export
              </span>
            </div>
          </div>

          <ol className="relative px-4 py-3 sm:px-5">
            <span
              aria-hidden="true"
              className="absolute top-6 bottom-6 left-[3.9375rem] w-px bg-[var(--color-hairline)] sm:left-[5.1875rem]"
            />

            {ENTRIES.map((e) => {
              const open = e.id === openId
              return (
                <li key={e.id} className="relative">
                  <h4>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`audit-${e.id}`}
                      // Collapsing the open one leaves nothing selected, which
                      // is a perfectly reasonable thing to want.
                      onClick={() => setOpenId(open ? '' : e.id)}
                      className="group flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors duration-[var(--duration-fast)] sm:gap-4"
                    >
                      <span className="w-[3.25rem] shrink-0 text-right font-mono text-micro text-[var(--color-text-subtle)] tabular-nums sm:w-[4.5rem] sm:text-meta">
                        {e.time}
                      </span>

                      <span
                        className={cn(
                          'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ring-4 ring-[var(--color-surface)] transition-colors',
                          open
                            ? 'bg-[rgb(16_185_129/0.15)] text-[var(--color-accent-400)]'
                            : 'bg-[var(--color-ink-700)] text-[var(--color-text-subtle)] group-hover:text-[var(--color-text-muted)]',
                        )}
                      >
                        {e.icon}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ui text-[var(--color-text)]">
                          {e.action}
                        </span>
                        <span className="block truncate text-meta text-[var(--color-text-subtle)]">
                          {e.actor} · {e.role}
                        </span>
                      </span>

                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className={cn(
                          'shrink-0 text-[var(--color-text-subtle)] transition-transform duration-[var(--duration-base)]',
                          open && 'rotate-180',
                        )}
                      />
                    </button>
                  </h4>

                  {open && (
                    <div
                      id={`audit-${e.id}`}
                      className="motion-safe:animate-fade mb-2 ml-[4.0625rem] rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3 sm:ml-[5.75rem]"
                    >
                      <dl className="space-y-1.5">
                        {e.detail.map((d) => (
                          <div key={d.label} className="flex gap-3">
                            <dt className="w-20 shrink-0 text-micro tracking-[0.06em] text-[var(--color-text-subtle)] uppercase">
                              {d.label}
                            </dt>
                            <dd className="min-w-0 flex-1 text-ui-sm leading-snug text-[var(--color-text-muted)]">
                              {d.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-hairline)] px-4 py-3 sm:px-5">
            <p className="flex items-center gap-1.5 text-meta text-[var(--color-text-subtle)]">
              <Lock size={12} aria-hidden="true" className="text-[var(--color-accent-400)]" />
              Appended, never edited
            </p>
            <p className="flex items-center gap-1.5 text-meta text-[var(--color-text-subtle)]">
              <Link2 size={12} aria-hidden="true" />
              Kept with the document, for as long as the document
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
            Why organizations ask for this
          </h3>
          <ul className="mt-4 space-y-3">
            {REASONS.map((r) => (
              <li
                key={r.title}
                className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-4 transition-colors duration-[var(--duration-base)] hover:border-[var(--color-hairline-strong)]"
              >
                <p className="flex items-center gap-2 text-ui-lg font-medium text-[var(--color-text)]">
                  <span className="text-[var(--color-accent-400)]">{r.icon}</span>
                  {r.title}
                </p>
                <p className="mt-2 text-ui leading-relaxed text-[var(--color-text-muted)]">
                  {r.copy}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
