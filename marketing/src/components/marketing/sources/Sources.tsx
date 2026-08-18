import { ArrowDown, KeyRound, Mail, ScrollText, Search, Timer, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { Logo } from '../Logo'
import { cn } from '@/lib/cn'
import { useT, type Dict } from '@/i18n'

type Availability = 'live' | 'soon'

type Source = { name: string; note: string; availability: Availability }

/**
 * Connected cloud storage.
 *
 * Availability is stated per provider and nowhere else — no "and more",
 * no grid of logos implying a partnership that doesn't exist. SharePoint is
 * marked because it isn't built; the other three are because they are.
 */
function drives(t: Dict): Source[] {
  return [
    {
      name: 'Google Drive',
      note: t.sources.drives.google,
      availability: 'live',
    },
    {
      name: 'OneDrive',
      note: t.sources.drives.onedrive,
      availability: 'live',
    },
    {
      name: 'Dropbox',
      note: t.sources.drives.dropbox,
      availability: 'live',
    },
    {
      name: 'SharePoint',
      note: t.sources.drives.sharepoint,
      availability: 'soon',
    },
  ]
}

function routes(t: Dict): (Source & { icon: ReactNode })[] {
  return [
    {
      name: t.sources.routes.device.name,
      note: t.sources.routes.device.note,
      availability: 'live',
      icon: <Upload size={14} aria-hidden="true" />,
    },
    {
      name: t.sources.routes.email.name,
      note: t.sources.routes.email.note,
      availability: 'live',
      icon: <Mail size={14} aria-hidden="true" />,
    },
    {
      name: t.sources.routes.api.name,
      note: t.sources.routes.api.note,
      availability: 'live',
      icon: <KeyRound size={14} aria-hidden="true" />,
    },
  ]
}

/** What happens to a document *because* it arrived — the point of the section. */
function after(t: Dict) {
  return [
    {
      icon: <Search size={14} aria-hidden="true" />,
      title: t.sources.after.read.title,
      copy: t.sources.after.read.copy,
    },
    {
      icon: <Timer size={14} aria-hidden="true" />,
      title: t.sources.after.dated.title,
      copy: t.sources.after.dated.copy,
    },
    {
      icon: <ScrollText size={14} aria-hidden="true" />,
      title: t.sources.after.recorded.title,
      copy: t.sources.after.recorded.copy,
    },
  ]
}

/**
 * Connected sources.
 *
 * The brief's warning is the design constraint: an integrations page is a wall
 * of logos that says nothing except "we exist in the same market as these
 * companies". So the section is shaped as an intake funnel instead — four
 * drives and three other routes converging on the vault, and then, below it,
 * what actually happens to a document because it arrived there. Import is the
 * first step of the lifecycle, not a feature sitting beside it.
 *
 * No brand logos are drawn. Approximating Google Drive's mark from memory
 * would look worse than the typography does, and official assets belong in the
 * repository rather than in a component. Names are set in text; if the marks
 * are wanted later, they drop into the tile in `Row`.
 */
export function Sources() {
  const t = useT()

  return (
    <Section
      id="sources"
      tone="seam"
      eyebrow={t.sources.eyebrow}
      title={t.sources.title}
      lead={t.sources.lead}
    >
      {/* Both columns are sources; the vault is beneath them. So they sit side
          by side and the funnel points down from between them — an arrow in a
          middle column would be pointing at the column next to it. */}
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        {/* Cloud storage. */}
        <Reveal>
          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
            <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
              {t.sources.cloudTitle}
            </h3>
            <ul className="mt-4 space-y-3">
              {drives(t).map((d) => (
                <Row key={d.name} source={d} />
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Everything else that arrives. */}
        <Reveal index={1}>
          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
            <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
              {t.sources.routesTitle}
            </h3>
            <ul className="mt-4 space-y-3">
              {routes(t).map((r) => (
                <Row key={r.name} source={r} icon={r.icon} />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* The confluence. */}
      <div aria-hidden="true" className="flex flex-col items-center py-1">
        <span className="h-6 w-px bg-[linear-gradient(180deg,transparent,var(--color-hairline-strong))]" />
        <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgb(16_185_129/0.3)] bg-[rgb(16_185_129/0.08)] text-[var(--color-accent-400)]">
          <ArrowDown size={14} />
        </span>
        <span className="h-6 w-px bg-[linear-gradient(180deg,rgb(16_185_129/0.5),transparent)]" />
      </div>

      {/* The vault, and then the consequence. */}
      <Reveal>
        <div className="rounded-2xl border border-[rgb(16_185_129/0.25)] bg-[rgb(16_185_129/0.04)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Logo />
            <p className="text-ui text-[var(--color-text-muted)]">{t.sources.copied}</p>
          </div>

          <div className="mt-5 grid gap-5 border-t border-[rgb(16_185_129/0.18)] pt-5 sm:grid-cols-3">
            {after(t).map((a) => (
              <div key={a.title}>
                <p className="flex items-center gap-2 text-ui-lg font-medium text-[var(--color-text)]">
                  <span className="text-[var(--color-accent-400)]">{a.icon}</span>
                  {a.title}
                </p>
                <p className="mt-2 text-ui leading-relaxed text-[var(--color-text-muted)]">
                  {a.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function Row({ source, icon }: { source: Source; icon?: ReactNode }) {
  const t = useT()
  const soon = source.availability === 'soon'
  return (
    <li className={cn('flex items-start gap-3', soon && 'opacity-70')}>
      {/* The tile is where a brand mark would go, if official assets are ever
          added. Until then it stays a neutral initial rather than a guess at
          somebody's logo. */}
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-micro font-medium text-[var(--color-text-subtle)] ring-1 ring-[var(--color-hairline)]">
        {icon ?? source.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-ui-lg font-medium text-[var(--color-text)]">{source.name}</span>
          {soon && (
            <span className="inline-flex items-center rounded-full border border-dashed border-[var(--color-hairline-strong)] px-2 py-0.5 text-micro text-[var(--color-text-subtle)]">
              {t.common.comingSoon}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-ui-sm leading-snug text-[var(--color-text-subtle)]">
          {source.note}
        </span>
      </span>
    </li>
  )
}
