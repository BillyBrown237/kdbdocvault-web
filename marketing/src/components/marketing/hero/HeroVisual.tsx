import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Bell,
  CircleCheck,
  Clock,
  FileText,
  Filter,
  Folder,
  Link2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useTypewriter } from '@/lib/useTypewriter'
import { useT, type Dict } from '@/i18n'
import {
  activity as baseActivity,
  docs as baseDocs,
  folders,
  incomingDoc,
  lifecycle,
  searchPhrases,
  statusLabels,
  STATUS_META,
  type Activity,
  type Doc,
} from './workspace'

function signedEvent(t: Dict): Activity {
  return {
    id: 'a-signed',
    who: 'Marie Ndongo',
    action: t.hero.events.signedDoc,
    target: t.hero.eventTargets.msa,
    at: t.hero.when.now,
  }
}

function uploadEvent(t: Dict): Activity {
  return {
    id: 'a-upload',
    who: 'Paul Ekani',
    action: t.hero.events.uploaded,
    target: t.hero.eventTargets.amendment,
    at: t.hero.when.now,
  }
}

/**
 * The hero's product visualisation.
 *
 * A working-looking KDB Doc Vault workspace rather than an illustration: real
 * document names, real lifecycle states, a real expiry warning, a real share
 * link. The animation tells one short story and then stops — a document is
 * signed, another arrives — because a hero that loops forever competes with
 * the headline instead of supporting it.
 *
 * Accessibility: the whole thing is a single labelled image. Nothing inside is
 * focusable (no `button`, no `input` — they are divs that look like them), so
 * a keyboard user tabs from the CTAs straight past it, and a screen reader
 * gets one sentence instead of forty fragments of fake UI.
 */
export function HeroVisual() {
  const t = useT()
  const reduced = useReducedMotion()

  const [signed, setSigned] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (reduced) {
      // Skip to the end of the story rather than playing it.
      setSigned(true)
      setArrived(true)
      return
    }

    const timers = [
      window.setTimeout(() => setSigned(true), 3400),
      window.setTimeout(() => {
        setArrived(true)
        setToast(true)
      }, 6000),
      window.setTimeout(() => setToast(false), 10400),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [reduced])

  const docs: Doc[] = baseDocs(t).map((d) =>
    d.id === 'msa' && signed ? { ...d, status: 'signed', updated: t.hero.when.now } : d,
  )

  const activity: Activity[] = [
    ...(arrived ? [uploadEvent(t)] : []),
    ...(signed ? [signedEvent(t)] : []),
    ...baseActivity(t),
  ].slice(0, 4)

  return (
    <div role="img" aria-label={t.hero.visualLabel} className="relative">
      {/* The frame's own light. Sits behind the glass so the edges glow rather
          than the surface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-4 -top-6 bottom-2 rounded-[2.5rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgb(16_185_129/0.16),transparent_70%)] blur-2xl"
      />

      <div className="product-sheen relative overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink-850)] shadow-frame">
        <TopBar enabled={!reduced} />

        <div className="grid grid-cols-1 md:grid-cols-[13rem_1fr] xl:grid-cols-[13rem_1fr_16rem]">
          <FolderRail incoming={arrived} />
          <DocumentPane docs={docs} signed={signed} />
          <ActivityRail activity={activity} />
        </div>

        {/* A document landing in the workspace, announced the way the product
            actually announces it. */}
        {toast && (
          <div className="motion-safe:animate-drop-in absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink-800)]/95 px-4 py-3 shadow-float backdrop-blur-sm sm:left-auto sm:max-w-xs">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(16_185_129/0.12)]">
              <CircleCheck size={16} className="text-[var(--color-accent-400)]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-[var(--color-text)]">
                {incomingDoc(t).name}
              </span>
              <span className="block text-meta text-[var(--color-text-subtle)]">
                {t.hero.addedTo}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- top bar */

function TopBar({ enabled }: { enabled: boolean }) {
  const t = useT()
  const query = useTypewriter(searchPhrases(t), { enabled })

  return (
    <div className="flex h-14 items-center gap-3 border-b border-[var(--color-hairline)] px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent-600)] text-meta font-semibold text-white">
          KH
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-xs font-medium text-[var(--color-text)]">KDB Holding</span>
          <span className="block text-micro text-[var(--color-text-subtle)]">
            {t.hero.workspace}
          </span>
        </span>
      </div>

      {/* Not an <input>: a fake field that steals focus or accepts typing is
          worse than no field at all. */}
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-black/25 px-3">
        <Search size={14} className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-text-muted)]">
          {query}
          <span className="motion-safe:animate-caret ml-px inline-block h-3 w-px translate-y-0.5 bg-[var(--color-accent-400)]" />
        </span>
        <span className="hidden shrink-0 rounded border border-[var(--color-hairline)] px-1.5 font-mono text-micro text-[var(--color-text-subtle)] lg:block">
          ⌘K
        </span>
      </div>

      {/* The security indicator: a heartbeat, not a badge that shouts. */}
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[rgb(16_185_129/0.10)] px-2.5 py-1 text-meta text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.22)] sm:inline-flex">
        <span className="relative flex h-1.5 w-1.5">
          <span className="motion-safe:animate-ping-ring absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-400)]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent-400)]" />
        </span>
        <ShieldCheck size={12} aria-hidden="true" />
        {t.hero.encrypted}
      </span>

      <Bell size={16} className="hidden shrink-0 text-[var(--color-text-subtle)] sm:block" aria-hidden="true" />
      <AvatarStack />
    </div>
  )
}

function AvatarStack() {
  return (
    <span className="flex shrink-0 -space-x-1.5">
      {['MN', 'PE', 'AB'].map((initials) => (
        <span
          key={initials}
          className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano font-medium text-[var(--color-text-muted)] ring-2 ring-[var(--color-ink-850)]"
        >
          {initials}
        </span>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------ folder rail */

function FolderRail({ incoming }: { incoming: boolean }) {
  const t = useT()

  return (
    <div className="hidden flex-col justify-between border-r border-[var(--color-hairline)] p-3 md:flex">
      <div>
        <p className="px-2 pb-2 font-mono text-micro tracking-[0.12em] text-[var(--color-text-subtle)] uppercase">
          {t.hero.folders}
        </p>
        <ul className="space-y-0.5">
          {folders(t).map((f) => {
            // The count on Contracts ticks up when the new document lands —
            // the small consequence that makes the arrival feel real.
            const count = f.id === 'contracts' && incoming ? f.count + 1 : f.count
            return (
              <li
                key={f.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                  f.active
                    ? 'bg-white/[0.05] font-medium text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)]',
                )}
              >
                <Folder
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    'shrink-0',
                    f.active ? 'text-[var(--color-accent-400)]' : 'text-[var(--color-text-subtle)]',
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="font-mono text-micro text-[var(--color-text-subtle)] tabular-nums">
                  {count}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-6 px-2">
        <div className="flex items-baseline justify-between text-micro text-[var(--color-text-subtle)]">
          <span>{t.hero.storage}</span>
          <span className="font-mono">4.2 / 20 GB</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-[21%] rounded-full bg-[var(--color-accent-600)]" />
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- document pane */

function DocumentPane({ docs, signed }: { docs: Doc[]; signed: boolean }) {
  const t = useT()

  return (
    <div className="min-w-0 p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-[var(--color-text)]">{t.hero.recent}</p>
        <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-micro text-[var(--color-text-subtle)]">
          1 248
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="hidden items-center gap-1 rounded-lg border border-[var(--color-hairline)] px-2 py-1 text-micro text-[var(--color-text-muted)] sm:flex">
            <Filter size={12} aria-hidden="true" />
            {t.hero.filterAll}
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-[var(--color-accent-600)] px-2 py-1 text-micro font-medium text-white">
            <Plus size={12} aria-hidden="true" />
            {t.hero.upload}
          </span>
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {docs.map((doc, i) => (
          <DocRow key={doc.id} doc={doc} index={i} />
        ))}
      </ul>

      <LifecycleBar signed={signed} />
    </div>
  )
}

function DocRow({ doc, index }: { doc: Doc; index: number }) {
  const meta = STATUS_META[doc.status]

  return (
    <li
      className="motion-safe:animate-drop-in flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-[var(--color-hairline)] hover:bg-white/[0.02]"
      style={{ '--i': index } as CSSProperties}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-[var(--color-hairline)]">
        <FileText size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-[var(--color-text)]">{doc.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-micro text-[var(--color-text-subtle)]">
          <span className="font-mono">{doc.ext}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{doc.version}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{doc.owner}</span>
          {/* The expiry warning gets its own line on mobile, where the status
              column is hidden. */}
          {doc.expiresIn && (
            <span className="inline-flex items-center gap-1 text-[var(--color-status-amber)] lg:hidden">
              <Clock size={10} aria-hidden="true" />
              12 d
            </span>
          )}
        </span>
      </span>

      <span className="hidden shrink-0 lg:block">
        <StatusPill doc={doc} />
      </span>

      {/* Below `lg` the pill collapses to its dot: the state is still visible,
          the row still fits a 360px screen. */}
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full lg:hidden', meta.dot)} />

      <span className="hidden w-16 shrink-0 text-right font-mono text-micro text-[var(--color-text-subtle)] xl:block">
        {doc.updated}
      </span>
    </li>
  )
}

function StatusPill({ doc }: { doc: Doc }) {
  const t = useT()
  const meta = STATUS_META[doc.status]
  return (
    <span
      // Re-keyed on status so a change crossfades rather than swapping.
      key={doc.status}
      className={cn(
        'motion-safe:animate-fade inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-micro whitespace-nowrap ring-1',
        meta.chip,
        meta.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {doc.expiresIn ?? statusLabels(t)[doc.status]}
    </span>
  )
}

/**
 * Where the selected document sits in its lifecycle. Advances one step when
 * the signature lands — the point of the whole animation.
 */
function LifecycleBar({ signed }: { signed: boolean }) {
  const t = useT()
  const steps = lifecycle(t)
  const active = signed ? 2 : 1
  const progress = ((active + 0.5) / steps.length) * 100

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <p className="truncate text-meta font-medium text-[var(--color-text-muted)]">
          {t.hero.lifecycle} · {t.hero.eventTargets.msa}
        </p>
        <span className="hidden font-mono text-micro text-[var(--color-text-subtle)] sm:block">
          {t.hero.retain}
        </span>
      </div>

      <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[var(--color-accent-600)] transition-[width] duration-700 ease-[var(--ease-out-soft)]"
          style={{ width: `${progress}%` }}
        />
        <div
          aria-hidden="true"
          className="motion-safe:animate-sweep absolute inset-y-0 left-0 w-1/4 bg-[linear-gradient(90deg,transparent,rgb(52_211_153/0.55),transparent)]"
        />
      </div>

      <ol className="mt-2 flex justify-between">
        {steps.map((step, i) => (
          <li
            key={step}
            className={cn(
              'text-micro transition-colors duration-500',
              i < active && 'text-[var(--color-text-subtle)]',
              i === active && 'font-medium text-[var(--color-accent-400)]',
              i > active && 'text-[var(--color-text-subtle)]',
            )}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ---------------------------------------------------------- activity rail */

function ActivityRail({ activity }: { activity: Activity[] }) {
  const t = useT()

  return (
    <div className="hidden flex-col border-l border-[var(--color-hairline)] p-3 xl:flex">
      <p className="px-1 pb-3 font-mono text-micro tracking-[0.12em] text-[var(--color-text-subtle)] uppercase">
        {t.hero.activity}
      </p>

      <ul className="space-y-3">
        {activity.map((a) => (
          <li key={a.id} className="motion-safe:animate-rise flex gap-2.5">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano font-medium text-[var(--color-text-muted)]">
              {initials(a.who)}
            </span>
            <p className="min-w-0 text-meta leading-snug text-[var(--color-text-subtle)]">
              <span className="font-medium text-[var(--color-text-muted)]">{a.who}</span> {a.action}{' '}
              <span className="text-[var(--color-text-muted)]">{a.target}</span>
              <span className="mt-0.5 block font-mono text-nano">{a.at}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <div className="rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
          <p className="flex items-center gap-1.5 text-meta font-medium text-[var(--color-text-muted)]">
            <Link2 size={12} aria-hidden="true" />
            {t.hero.secureLink}
          </p>
          <p className="mt-2 truncate rounded-md bg-black/30 px-2 py-1 font-mono text-micro text-[var(--color-text-subtle)]">
            kdb.vault/s/9f2c…a41
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-micro text-[var(--color-text-subtle)]">
            <Lock size={10} aria-hidden="true" className="text-[var(--color-accent-400)]" />
            {t.hero.linkRules}
          </p>
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
