import { Fragment } from 'react'
import type { ReactNode } from 'react'
import {
  Check,
  Database,
  Minus,
  Route,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { useT, type Dict } from '@/i18n'

/**
 * The answer to the descent above.
 *
 * Six capabilities, each illustrated with a fragment of the actual interface
 * rather than an icon in a circle — a permission matrix with real roles, an
 * approval chain mid-flight, three lines of a real audit trail. An icon says
 * "protect"; a matrix shows what protection means, and the difference is the
 * whole argument.
 *
 * The transition from the problem section is carried by the surface: the page
 * lifts to `raised` and its top edge picks up an emerald hairline, so the
 * spine that ended on the product's node appears to open out into this.
 */
export function Solution() {
  const t = useT()

  return (
    <Section
      id="solution"
      tone="raised"
      eyebrow={t.solution.eyebrow}
      title={t.solution.title}
      lead={t.solution.lead}
      className="before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgb(52_211_153/0.45),transparent)] before:content-['']"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {capabilities(t).map((c, i) => (
          <Reveal key={c.title} index={i % 3} className="h-full">
            <article className="flex h-full flex-col rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5 transition-colors duration-[var(--duration-base)] hover:border-[var(--color-hairline-strong)]">
              <h3 className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.18)]">
                  {c.icon}
                </span>
                {c.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{c.copy}</p>

              <div className="mt-5 min-h-[7.5rem] rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
                {c.visual}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* --------------------------------------------------------------- visuals */

function Row({
  children,
  trailing,
  className,
}: {
  children: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 py-1', className)}>
      <span className="min-w-0 flex-1 truncate font-mono text-meta text-[var(--color-text-muted)]">
        {children}
      </span>
      {trailing}
    </div>
  )
}

/** Store — the vault's own shelves, with what's on them. */
function StoreVisual() {
  const t = useT()

  return (
    <div>
      {[
        // Reused from the hero's dictionary rather than duplicated here: these
        // are the same folders the product shows, and one list of folder names
        // is easier to keep translated than two.
        { name: t.hero.folderNames.contracts, count: 317 },
        { name: t.hero.folderNames.compliance, count: 93 },
        { name: t.hero.folderNames.hr, count: 174 },
      ].map((f) => (
        <Row
          key={f.name}
          trailing={
            <span className="font-mono text-micro text-[var(--color-text-subtle)] tabular-nums">
              {f.count}
            </span>
          }
        >
          <span className="text-[var(--color-text-muted)]">{f.name}</span>
        </Row>
      ))}
      <p className="mt-2 flex items-center gap-1.5 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-accent-400)]">
        <ShieldCheck size={12} aria-hidden="true" />
        {t.solution.store.note}
      </p>
    </div>
  )
}

/** Find — the match is inside the file, not in its name. */
function FindVisual() {
  const t = useT()

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-black/30 px-2.5 py-1.5">
        <Search size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
        <span className="truncate font-mono text-meta text-[var(--color-text-muted)]">
          {t.solution.find.query}
        </span>
      </div>
      <p className="mt-2.5 truncate text-meta text-[var(--color-text)]">{t.solution.find.result}</p>
      <p className="mt-1 text-micro leading-snug text-[var(--color-text-subtle)]">
        {t.solution.find.snippetBefore}
        <mark className="rounded bg-[rgb(16_185_129/0.18)] px-0.5 text-[var(--color-accent-400)]">
          {t.solution.find.snippetMatch}
        </mark>
        {t.solution.find.snippetAfter}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {t.solution.find.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-nano text-[var(--color-text-subtle)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Protect — what "control access" actually looks like. */
function permissions(t: Dict): { role: string; grants: boolean[] }[] {
  return [
    { role: t.solution.protect.roles.owner, grants: [true, true, true] },
    { role: t.solution.protect.roles.member, grants: [true, true, false] },
    { role: t.solution.protect.roles.guest, grants: [true, false, false] },
  ]
}

function ProtectVisual() {
  const t = useT()

  return (
    <div>
      <div className="grid grid-cols-[1fr_repeat(3,1.6rem)] items-center gap-y-1 text-nano">
        <span />
        {t.solution.protect.columns.map((h) => (
          <span key={h} className="text-center text-[var(--color-text-subtle)]">
            {h}
          </span>
        ))}

        {permissions(t).map((p) => (
          <Fragment key={p.role}>
            <span className="font-mono text-meta text-[var(--color-text-muted)]">{p.role}</span>
            {p.grants.map((granted, i) => (
              <span key={i} className="grid place-items-center">
                {granted ? (
                  <Check size={12} aria-hidden="true" className="text-[var(--color-accent-400)]" />
                ) : (
                  <Minus size={12} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
                )}
              </span>
            ))}
          </Fragment>
        ))}
      </div>
      <p className="mt-2 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.solution.protect.note}
      </p>
    </div>
  )
}

/** Collaborate — an approval chain caught mid-flight. */
function CollaborateVisual() {
  const t = useT()

  return (
    <div>
      <p className="pb-2 text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
        {t.solution.collaborate.step}
      </p>
      <div className="flex items-center">
        {[
          { who: 'MN', done: true },
          { who: 'PE', done: true },
          { who: 'AB', done: false },
          { who: 'JT', done: false },
        ].map((s, i, all) => (
          <Fragment key={s.who}>
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-nano font-medium',
                s.done
                  ? 'bg-[rgb(16_185_129/0.15)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.35)]'
                  : i === 2
                    ? 'bg-[rgb(56_189_248/0.12)] text-[var(--color-status-sky)] ring-1 ring-[rgb(56_189_248/0.35)]'
                    : 'bg-white/[0.04] text-[var(--color-text-subtle)]',
              )}
            >
              {s.who}
            </span>
            {i < all.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-px flex-1',
                  s.done ? 'bg-[rgb(16_185_129/0.35)]' : 'bg-[var(--color-hairline)]',
                )}
              />
            )}
          </Fragment>
        ))}
      </div>
      <p className="mt-2.5 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.solution.collaborate.note}
      </p>
    </div>
  )
}

/** Track — three lines of a real audit trail. */
function TrackVisual() {
  const t = useT()

  return (
    <div>
      {[
        { at: '14:02', who: 'Marie', what: t.solution.track.events[0] },
        { at: '13:58', who: 'Paul', what: t.solution.track.events[1] },
        { at: '11:20', who: 'Aïcha', what: t.solution.track.events[2] },
      ].map((e) => (
        <div key={e.at} className="flex items-baseline gap-2 py-1">
          <span className="font-mono text-micro text-[var(--color-text-subtle)] tabular-nums">
            {e.at}
          </span>
          <span className="min-w-0 flex-1 truncate text-meta text-[var(--color-text-muted)]">
            <span className="text-[var(--color-text)]">{e.who}</span> {e.what}
          </span>
        </div>
      ))}
      <p className="mt-2 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.solution.track.note}
      </p>
    </div>
  )
}

/** Automate — one rule, stated the way the product states it. */
function AutomateVisual() {
  const t = useT()

  return (
    <div>
      <div className="rounded-lg border border-[var(--color-hairline)] bg-black/30 p-2.5">
        <p className="font-mono text-micro leading-relaxed text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-subtle)]">{t.solution.automate.when}</span>{' '}
          {t.solution.automate.expiry}{' '}
          <span className="text-[var(--color-text-subtle)]">{t.solution.automate.inWords}</span>{' '}
          <span className="text-[var(--color-status-amber)]">{t.solution.automate.days30}</span>
          <br />
          <span className="text-[var(--color-text-subtle)]">{t.solution.automate.then}</span>{' '}
          {t.solution.automate.action}{' '}
          <span className="text-[var(--color-text-subtle)]">{t.solution.automate.plus}</span>{' '}
          {t.solution.automate.legal}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-micro text-[var(--color-text-subtle)]">{t.solution.automate.also}</span>
        {/* A switch drawn, not a real one — nothing in these panels is
            interactive, so nothing here is focusable. */}
        <span
          aria-hidden="true"
          className="flex h-3.5 w-6 items-center rounded-full bg-[rgb(16_185_129/0.35)] px-0.5"
        >
          <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[var(--color-accent-400)]" />
        </span>
      </div>
    </div>
  )
}

function capabilities(t: Dict) {
  return [
    {
      title: t.solution.store.title,
      icon: <Database size={14} aria-hidden="true" />,
      copy: t.solution.store.copy,
      visual: <StoreVisual />,
    },
    {
      title: t.solution.find.title,
      icon: <Search size={14} aria-hidden="true" />,
      copy: t.solution.find.copy,
      visual: <FindVisual />,
    },
    {
      title: t.solution.protect.title,
      icon: <ShieldCheck size={14} aria-hidden="true" />,
      copy: t.solution.protect.copy,
      visual: <ProtectVisual />,
    },
    {
      title: t.solution.collaborate.title,
      icon: <Users size={14} aria-hidden="true" />,
      copy: t.solution.collaborate.copy,
      visual: <CollaborateVisual />,
    },
    {
      title: t.solution.track.title,
      icon: <Route size={14} aria-hidden="true" />,
      copy: t.solution.track.copy,
      visual: <TrackVisual />,
    },
    {
      title: t.solution.automate.title,
      icon: <Zap size={14} aria-hidden="true" />,
      copy: t.solution.automate.copy,
      visual: <AutomateVisual />,
    },
  ]
}
