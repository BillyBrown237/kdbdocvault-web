import { Fragment } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Clock,
  FolderOpen,
  Link2,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { REGISTER_URL } from '@/lib/links'
import { useT } from '@/i18n'

/**
 * Who it is for.
 *
 * The three panels are told apart by their *contents*, not by decoration.
 * A personal vault is a short list of documents that must not be lost; a team
 * workspace is a folder with other people in it; an organization is a table of
 * departments and the policies applied to them. Density rises across the three
 * because that is what actually happens — and it lets a reader place
 * themselves before finishing the first sentence.
 *
 * Each keeps one accent from the existing token set (emerald, sky, violet) as
 * a hairline at the top of the card and a tint on its icon. Nothing else
 * changes: same surfaces, same hairlines, same mono microtext.
 *
 * No customer logos, no testimonials, no "trusted by" row. There is nothing
 * true to put there yet, and an invented one is the fastest way to lose a
 * reader who recognises the stock photo.
 */

type Tint = 'emerald' | 'sky' | 'violet'

const TINTS: Record<Tint, { rule: string; tile: string }> = {
  emerald: {
    rule: 'bg-[linear-gradient(90deg,rgb(16_185_129/0.55),transparent)]',
    tile: 'bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.20)]',
  },
  sky: {
    rule: 'bg-[linear-gradient(90deg,rgb(56_189_248/0.55),transparent)]',
    tile: 'bg-[rgb(56_189_248/0.10)] text-[var(--color-status-sky)] ring-[rgb(56_189_248/0.20)]',
  },
  violet: {
    rule: 'bg-[linear-gradient(90deg,rgb(167_139_250/0.55),transparent)]',
    tile: 'bg-[rgb(167_139_250/0.10)] text-[var(--color-status-violet)] ring-[rgb(167_139_250/0.20)]',
  },
}

export function Audiences() {
  const t = useT()

  return (
    <Section
      id="solutions"
      tone="page"
      eyebrow={t.audiences.eyebrow}
      title={t.audiences.title}
      lead={t.audiences.lead}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal index={0} className="h-full">
          <Card
            tint="emerald"
            icon={<UserRound size={14} aria-hidden="true" />}
            title={t.audiences.individuals.title}
            message={t.audiences.individuals.message}
            cta={t.audiences.individuals.cta}
          >
            <Individuals />
          </Card>
        </Reveal>

        <Reveal index={1} className="h-full">
          <Card
            tint="sky"
            icon={<Users size={14} aria-hidden="true" />}
            title={t.audiences.teams.title}
            message={t.audiences.teams.message}
            cta={t.audiences.teams.cta}
          >
            <Teams />
          </Card>
        </Reveal>

        <Reveal index={2} className="h-full">
          <Card
            tint="violet"
            icon={<Building2 size={14} aria-hidden="true" />}
            title={t.audiences.organizations.title}
            message={t.audiences.organizations.message}
            cta={t.audiences.organizations.cta}
          >
            <Organizations />
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}

function Card({
  tint,
  icon,
  title,
  message,
  cta,
  children,
}: {
  tint: Tint
  icon: ReactNode
  title: string
  message: string
  cta: string
  children: ReactNode
}) {
  const t = TINTS[tint]
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5 transition-colors duration-[var(--duration-base)] hover:border-[var(--color-hairline-strong)] sm:p-6">
      <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-px', t.rule)} />

      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1', t.tile)}>
          {icon}
        </span>
        <h3 className="text-h3 leading-snug font-semibold tracking-[-0.02em] text-[var(--color-text)]">
          {title}
        </h3>
      </div>

      <p className="mt-4 text-ui-lg leading-relaxed text-[var(--color-text-muted)]">
        {message}
      </p>

      <div className="mt-5 rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
        {children}
      </div>

      {/* A link, not a button. Three buttons here plus the pricing grid's four
          would leave the page with nine competing calls to action; these are
          really signposts — "this one is me" — so they read as links and let
          the two real CTAs stay the loudest things on the page. */}
      <div className="mt-6">
        <a
          href={REGISTER_URL}
          className="group inline-flex items-center gap-2 rounded-sm text-ui-lg font-medium text-[var(--color-accent-400)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-accent-500)]"
        >
          {cta}
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)] motion-safe:group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </article>
  )
}

/* ------------------------------------------------------- the three visuals */

/** A short list of things that must not be lost. Airy, because it is short. */
function Individuals() {
  const t = useT()
  // The warm row is styling, not copy: the third entry — health insurance — is
  // the one about to expire, so it carries the amber dot and amber meta.
  const items = t.audiences.individuals.items.map((item, i) => ({ ...item, warm: i === 2 }))
  return (
    <ul className="space-y-px">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2 py-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              i.warm ? 'bg-[var(--color-status-amber)]' : 'bg-[var(--color-slate-600)]',
            )}
          />
          <span className="min-w-0 flex-1 truncate text-ui-sm text-[var(--color-text-muted)]">
            {i.name}
          </span>
          <span
            className={cn(
              'shrink-0 font-mono text-nano whitespace-nowrap',
              i.warm ? 'text-[var(--color-status-amber)]' : 'text-[var(--color-text-subtle)]',
            )}
          >
            {i.meta}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** A folder with other people in it. */
function Teams() {
  const t = useT()
  const rows = t.audiences.teams.rows
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <FolderOpen size={14} aria-hidden="true" className="shrink-0 text-[var(--color-status-sky)]" />
        <span className="min-w-0 flex-1 truncate text-ui-sm text-[var(--color-text)]">
          {t.audiences.teams.folder}
        </span>
        <span className="flex shrink-0 -space-x-1.5">
          {['MN', 'PE', 'AB'].map((a) => (
            <span
              key={a}
              className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano font-medium text-[var(--color-text-muted)] ring-2 ring-[var(--color-ink-800)]"
            >
              {a}
            </span>
          ))}
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano text-[var(--color-text-subtle)] ring-2 ring-[var(--color-ink-800)]">
            +2
          </span>
        </span>
      </div>

      {/* The icon belongs to the position, not to the row: first is a comment
          thread, second an approval, third a share. Zipping them here keeps
          `noUncheckedIndexedAccess` happy without three index assertions, and
          a fourth row would simply fall back to the comment icon. */}
      <div className="space-y-1.5 border-t border-[var(--color-hairline)] pt-2.5">
        {rows.map((row, i) => {
          const Icon = [MessageSquare, ClipboardCheck, Link2][i] ?? MessageSquare
          return (
            <TeamRow
              key={row.name}
              name={row.name}
              chip={row.chip}
              icon={<Icon size={12} aria-hidden="true" />}
              note={row.note}
            />
          )
        })}
      </div>
    </div>
  )
}

function TeamRow({
  name,
  chip,
  icon,
  note,
}: {
  name: string
  chip: string
  icon: ReactNode
  note: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 rounded bg-white/[0.05] px-1 font-mono text-nano text-[var(--color-text-subtle)]">
        {chip}
      </span>
      <span className="min-w-0 flex-1 truncate text-ui-sm text-[var(--color-text-muted)]">
        {name}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-nano whitespace-nowrap text-[var(--color-text-subtle)]">
        {icon}
        {note}
      </span>
    </div>
  )
}

/** Departments, and the policy applied to each. The densest of the three. */
function Organizations() {
  const t = useT()
  const rows = t.audiences.organizations.rows
  return (
    <div>
      <div className="grid grid-cols-[1fr_2.5rem_4rem] gap-y-1 text-nano">
        <span className="text-[var(--color-text-subtle)]">
          {t.audiences.organizations.columns.department}
        </span>
        <span className="text-right text-[var(--color-text-subtle)]">
          {t.audiences.organizations.columns.keep}
        </span>
        <span className="text-right text-[var(--color-text-subtle)]">
          {t.audiences.organizations.columns.access}
        </span>

        {/* Fragments, not wrappers: each row's three cells have to be direct
            children of the grid or they stop lining up with the header. */}
        {rows.map((r) => (
          <Fragment key={r.dept}>
            <span className="truncate text-ui-sm text-[var(--color-text-muted)]">{r.dept}</span>
            <span className="text-right font-mono text-micro text-[var(--color-text-subtle)]">
              {r.retention}
            </span>
            <span
              className={cn(
                'text-right font-mono text-micro',
                r.access === t.audiences.organizations.restricted
                  ? 'text-[var(--color-status-violet)]'
                  : 'text-[var(--color-text-subtle)]',
              )}
            >
              {r.access}
            </span>
          </Fragment>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[var(--color-hairline)] pt-2.5">
        {[
          {
            label: t.audiences.organizations.chips[0],
            icon: <ScrollText size={10} aria-hidden="true" />,
          },
          {
            label: t.audiences.organizations.chips[1],
            icon: <ClipboardCheck size={10} aria-hidden="true" />,
          },
          {
            label: t.audiences.organizations.chips[2],
            icon: <ShieldCheck size={10} aria-hidden="true" />,
          },
          {
            label: t.audiences.organizations.chips[3],
            icon: <Clock size={10} aria-hidden="true" />,
          },
        ].map((c) => (
          <span
            key={c.label}
            className="inline-flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-nano text-[var(--color-text-subtle)]"
          >
            {c.icon}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
