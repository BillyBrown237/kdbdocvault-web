import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Check, FileText, Link2, Lock, Minus, Tag } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  CAPABILITIES,
  DOC,
  EVENTS,
  PRINCIPALS,
  RULES,
  VERSIONS,
  WORKFLOW,
  WORKFLOW_CURRENT,
  type Version,
} from './document'

const DAY = 86_400_000

/* --------------------------------------------------------------- overview */

export function OverviewPanel({ version }: { version: Version }) {
  // Computed rather than written down: a hard-coded "in 361 days" is correct
  // for one day and wrong for the rest of the year.
  const now = Date.now()
  const start = Date.parse(`${DOC.createdISO}T00:00:00Z`)
  const end = Date.parse(`${DOC.expiresISO}T00:00:00Z`)
  const daysLeft = Math.max(0, Math.round((end - now) / DAY))
  const elapsed = Math.min(1, Math.max(0, (now - start) / (end - start)))

  return (
    <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
      {/* A page, not an icon. The one light surface on the site — a document
          preview that isn't paper-coloured doesn't read as a document. */}
      <div className="mx-auto w-32 sm:mx-0">
        <div className="relative aspect-[1/1.32] overflow-hidden rounded-lg bg-[#E9EEF5] p-3 shadow-sheet">
          <div className="h-1.5 w-2/3 rounded-full bg-[#8FA0B6]" />
          <div className="mt-1.5 h-1 w-1/3 rounded-full bg-[#B9C5D4]" />
          <div className="mt-3 space-y-1">
            {[100, 92, 96, 78, 88, 94, 60].map((w, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full bg-[#C9D3E0]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          <div className="absolute right-3 bottom-3 left-3">
            <div className="h-[3px] w-1/2 rounded-full bg-[#C9D3E0]" />
            <div className="mt-2 h-4 w-16 rounded-sm border border-dashed border-[#A9B7C8]" />
          </div>
        </div>
        <p className="mt-2 text-center font-mono text-micro text-[var(--color-text-subtle)] sm:text-left">
          {DOC.pages} pages · {version.label}
        </p>
      </div>

      <div className="min-w-0">
        <dl className="space-y-3">
          <Field label="Description">
            Framework agreement covering logistics services for the 2026–2027 term,
            signed by both parties.
          </Field>
          <Field label="Reference">
            <span className="font-mono">{DOC.reference}</span>
          </Field>
          <Field label="Tags">
            <span className="flex flex-wrap gap-1.5">
              {['contract', 'logistics', 'signed'].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-micro text-[var(--color-text-subtle)]"
                >
                  <Tag size={10} aria-hidden="true" />
                  {t}
                </span>
              ))}
            </span>
          </Field>
          <Field label="Linked">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {['Amendment no. 1', 'Purchase order 4412'].map((l) => (
                <span key={l} className="inline-flex items-center gap-1.5">
                  <Link2 size={12} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
                  {l}
                </span>
              ))}
            </span>
          </Field>
        </dl>

        {/* `daysLeft` and the bar width are computed from the clock. */}
        <div
          suppressHydrationWarning
          className="mt-5 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-meta text-[var(--color-text-muted)]">Term</span>
            <span className="font-mono text-micro text-[var(--color-status-amber)] tabular-nums">
              {daysLeft} days left
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--color-accent-600)]"
              style={{ width: `${(elapsed * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-nano text-[var(--color-text-subtle)]">
            <span>{DOC.created}</span>
            <span>{DOC.expires}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:gap-3">
      <dt className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
        {label}
      </dt>
      <dd className="text-ui leading-relaxed text-[var(--color-text-muted)]">{children}</dd>
    </div>
  )
}

/* --------------------------------------------------------------- versions */

export function VersionsPanel({
  version,
  onSelect,
}: {
  version: Version
  onSelect: (v: Version) => void
}) {
  return (
    <div>
      <ul className="space-y-1.5">
        {VERSIONS.map((v) => {
          const selected = v.id === version.id
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelect(v)}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)]',
                  selected
                    ? 'border-[rgb(16_185_129/0.35)] bg-[rgb(16_185_129/0.06)]'
                    : 'border-[var(--color-hairline)] hover:border-[var(--color-hairline-strong)] hover:bg-white/[0.02]',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-7 w-9 shrink-0 place-items-center rounded-lg font-mono text-meta ring-1',
                    selected
                      ? 'bg-[rgb(16_185_129/0.12)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.3)]'
                      : 'bg-white/[0.04] text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
                  )}
                >
                  {v.label}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-ui text-[var(--color-text)]">{v.author}</span>
                    <span className="font-mono text-micro text-[var(--color-text-subtle)]">
                      {v.date}
                    </span>
                    {v.id === VERSIONS[0]?.id && (
                      <span className="rounded-full bg-[rgb(16_185_129/0.10)] px-1.5 py-0.5 text-nano text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.22)]">
                        current
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-ui-sm leading-snug text-[var(--color-text-muted)]">
                    {v.note}
                  </span>
                </span>

                <span className="hidden shrink-0 font-mono text-micro text-[var(--color-text-subtle)] sm:block">
                  {v.size}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-meta text-[var(--color-text-subtle)]">
        Every version is kept. Nothing is overwritten, and any version can be restored or
        compared.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- activity */

const TONE_DOT = {
  accent: 'bg-[var(--color-accent-400)]',
  sky: 'bg-[var(--color-status-sky)]',
  muted: 'bg-[var(--color-slate-600)]',
} as const

export function ActivityPanel() {
  return (
    <div>
      <ol className="relative">
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-[0.3125rem] w-px bg-[var(--color-hairline)]"
        />
        {EVENTS.map((e) => (
          <li key={e.id} className="relative pl-7">
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-3 left-0 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-surface)]',
                TONE_DOT[e.tone],
              )}
            />
            <div className="rounded-lg px-2 py-2 transition-colors duration-[var(--duration-fast)] hover:bg-white/[0.03]">
              <p className="flex flex-wrap items-baseline gap-x-2 text-ui text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text)]">{e.who}</span>
                {e.action}
                <span className="ml-auto font-mono text-micro whitespace-nowrap text-[var(--color-text-subtle)]">
                  {e.at}
                </span>
              </p>
              <p className="mt-0.5 font-mono text-micro text-[var(--color-text-subtle)]">
                {e.meta}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-center gap-1.5 text-meta text-[var(--color-text-subtle)]">
        <Lock size={12} aria-hidden="true" className="text-[var(--color-accent-400)]" />
        Append-only. Nothing can be edited out, and the trail exports as PDF or CSV.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------ permissions */

export function PermissionsPanel() {
  const [previewId, setPreviewId] = useState(PRINCIPALS[0]?.id ?? '')
  const preview = PRINCIPALS.find((p) => p.id === previewId) ?? PRINCIPALS[0]
  if (!preview) return null

  return (
    <div>
      <p className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
        Preview access as
      </p>

      {/* Not a tablist: these buttons don't reveal a panel each, they change
          one shared readout. `aria-pressed` says "this is the state I picked"
          without promising tab semantics the markup doesn't have. */}
      <div role="group" aria-label="Preview access as" className="mt-2 flex flex-wrap gap-1.5">
        {PRINCIPALS.map((p) => {
          const on = p.id === preview.id
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => setPreviewId(p.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-ui-sm transition-colors duration-[var(--duration-fast)]',
                on
                  ? 'bg-[rgb(16_185_129/0.12)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.3)]'
                  : 'text-[var(--color-text-muted)] ring-1 ring-[var(--color-hairline)] hover:bg-white/[0.04] hover:text-[var(--color-text)]',
              )}
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-ui text-[var(--color-text)]">
            {preview.name}
            <span className="ml-2 font-mono text-micro text-[var(--color-text-subtle)]">
              {preview.detail}
            </span>
          </p>
          <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-micro text-[var(--color-text-muted)]">
            {preview.role}
          </span>
        </div>

        <ul key={preview.id} className="motion-safe:animate-fade mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CAPABILITIES.map((cap, i) => {
            const granted = preview.grants[i] ?? false
            return (
              <li
                key={cap}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-ui-sm ring-1',
                  granted
                    ? 'bg-[rgb(16_185_129/0.08)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.22)]'
                    : 'text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
                )}
              >
                {granted ? (
                  <Check size={12} aria-hidden="true" />
                ) : (
                  <Minus size={12} aria-hidden="true" className="opacity-60" />
                )}
                {cap}
              </li>
            )
          })}
        </ul>

        <p key={`${preview.id}-note`} className="motion-safe:animate-fade mt-3 text-ui-sm leading-relaxed text-[var(--color-text-muted)]">
          {preview.summary}
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- workflow */

export function WorkflowPanel() {
  return (
    <div>
      {/* Horizontal on a wide screen, vertical on a narrow one — the same
          five steps, laid out the way each shape can actually hold them. */}
      <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
        {WORKFLOW.map((step, i) => {
          const done = i < WORKFLOW_CURRENT
          const current = i === WORKFLOW_CURRENT
          return (
            <li
              key={step.name}
              className="relative flex gap-3 pb-5 last:pb-0 sm:flex-1 sm:flex-col sm:gap-0 sm:pb-0"
            >
              <div className="flex flex-col items-center sm:w-full sm:flex-row">
                <span
                  className={cn(
                    'z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-nano font-medium ring-1',
                    done && 'bg-[rgb(16_185_129/0.14)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.35)]',
                    current && 'bg-[var(--color-accent-600)] text-white ring-[rgb(16_185_129/0.5)]',
                    !done && !current && 'bg-white/[0.04] text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
                  )}
                >
                  {done ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>
                {i < WORKFLOW.length - 1 && (
                  // `flex-1` in both orientations: it fills the remaining
                  // height in the stacked layout and the remaining width in
                  // the row one, so the connector never needs a fixed size.
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-px flex-1 sm:h-px sm:w-auto',
                      done ? 'bg-[rgb(16_185_129/0.35)]' : 'bg-[var(--color-hairline)]',
                    )}
                  />
                )}
              </div>

              <div className="pb-1 sm:mt-2.5 sm:pr-3">
                <p
                  className={cn(
                    'text-ui leading-tight',
                    current ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {step.name}
                </p>
                <p className="mt-0.5 font-mono text-micro text-[var(--color-text-subtle)]">
                  {step.at}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
        <p className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
          Rules attached to this document
        </p>
        <ul className="mt-2.5 space-y-2">
          {RULES.map((r) => (
            <li key={r.when} className="flex flex-wrap items-center gap-2 font-mono text-meta">
              <span className="text-[var(--color-text-muted)]">{r.when}</span>
              <ArrowRight size={12} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
              <span className="text-[var(--color-accent-400)]">{r.then}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-meta text-[var(--color-text-subtle)]">
        <FileText size={12} aria-hidden="true" />
        Next: renewal review assigned to Finance, opening 14 May 2027.
      </p>
    </div>
  )
}
