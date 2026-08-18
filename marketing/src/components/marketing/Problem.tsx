import type { ReactNode } from 'react'
import {
  ArrowDown,
  Clock,
  EyeOff,
  FileText,
  Laptop,
  Mail,
  Paperclip,
  Repeat,
  Search,
  Smartphone,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { Logo } from './Logo'
import { cn } from '@/lib/cn'
import { useT, type Dict } from '@/i18n'

/**
 * The problem, told as a descent.
 *
 * Four stages on a single spine — scattered files, lost context, missed
 * deadlines, security risks — each one a consequence of the one above it. The
 * spine's colour degrades as it falls, from slate to amber, and turns emerald
 * at the last node where the product enters.
 *
 * Deliberately not eight cards of icons: every problem is shown as the actual
 * artefact a person would recognise from their own week — three copies of the
 * same contract on three devices, a folder path eleven levels deep, a
 * certificate that expired four months ago and told nobody. Recognition does
 * the persuading. Nothing here is alarmist: no red, no warning triangles, no
 * invented statistics. The tone is "yes, that's my Tuesday", not "you are at
 * risk".
 */
export function Problem() {
  const t = useT()

  return (
    <Section
      id="problem"
      tone="page"
      eyebrow={t.problem.eyebrow}
      title={t.problem.title}
      lead={t.problem.lead}
    >
      {/* The spine lives on this wrapper, not on the list, so it can run past
          the last stage and meet the closing node. Its bottom padding is the
          gap it has to cross. */}
      <div className="relative pb-14">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-0 left-[0.4375rem] w-px bg-[linear-gradient(180deg,rgb(148_163_184/0.28),rgb(148_163_184/0.28)_38%,rgb(245_158_11/0.35)_66%,rgb(245_158_11/0.4)_88%,rgb(16_185_129/0.5))]"
        />

        <ol className="space-y-14">
          {stages(t).map((stage, i) => (
            <li key={stage.name} className="relative pl-9 sm:pl-12">
              {/* Outside <Reveal> on purpose: `animate-rise` uses a transform,
                  and a transformed ancestor becomes the containing block for
                  absolutely positioned children — the dot would jump to the
                  padding edge and drift during the animation. */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1.5 left-0 h-3.5 w-3.5 rounded-full ring-4 ring-[var(--color-page)]',
                  stage.warm ? 'bg-[var(--color-status-amber)]/70' : 'bg-[var(--color-slate-600)]',
                )}
              />

              {/* No stagger index: the stages are far enough apart that each
                  one enters view alone, so a delay would just be latency. */}
              <Reveal>
                <p className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-[var(--color-text-subtle)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-h3 leading-tight font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                    {stage.name}
                  </span>
                </p>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {stage.note}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {stage.problems.map((p) => (
                    <figure key={p.caption} className="min-w-0">
                      <div className="rounded-xl border border-[var(--color-hairline)] bg-black/25 p-3">
                        {p.artifact}
                      </div>
                      <figcaption className="mt-2.5 text-sm text-[var(--color-text-muted)]">
                        {p.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* The turn: the spine's last node is the product, and the arrow points
          into the section that follows. */}
      <div className="relative pl-9 sm:pl-12">
        {/* Bridges the few pixels between the spine's end and the dot's centre. */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-[0.4375rem] h-2.5 w-px bg-[var(--color-accent-500)]/50"
        />
        <span
          aria-hidden="true"
          className="absolute top-1 left-0 h-3.5 w-3.5 rounded-full bg-[var(--color-accent-500)] ring-4 ring-[var(--color-page)]"
        />
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Logo />
            <p className="text-sm text-[var(--color-text-muted)]">{t.problem.turn}</p>
            <ArrowDown
              size={16}
              aria-hidden="true"
              className="ml-auto hidden text-[var(--color-accent-400)] sm:block"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------- artefacts */

/** A row inside an artefact panel: leading mark, label, trailing note. */
function Line({
  icon,
  children,
  note,
  tone = 'muted',
}: {
  icon?: ReactNode
  children: ReactNode
  note?: ReactNode
  tone?: 'muted' | 'warm' | 'faint'
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      {icon && <span className="shrink-0 text-[var(--color-text-subtle)]">{icon}</span>}
      <span
        className={cn(
          'min-w-0 flex-1 truncate font-mono text-meta',
          tone === 'muted' && 'text-[var(--color-text-muted)]',
          tone === 'warm' && 'text-[var(--color-status-amber)]',
          tone === 'faint' && 'text-[var(--color-text-subtle)]',
        )}
      >
        {children}
      </span>
      {note && (
        <span className="shrink-0 text-micro whitespace-nowrap text-[var(--color-text-subtle)]">
          {note}
        </span>
      )}
    </div>
  )
}

/** Same document, three devices, three names. */
function ScatteredCopies() {
  const t = useT()

  return (
    <div>
      <Line icon={<Laptop size={12} aria-hidden="true" />} note={t.problem.artifacts.laptop}>
        contrat_final.pdf
      </Line>
      <Line icon={<Smartphone size={12} aria-hidden="true" />} note={t.problem.artifacts.whatsapp}>
        contrat_final_v2.pdf
      </Line>
      <Line icon={<Mail size={12} aria-hidden="true" />} note={t.problem.artifacts.email}>
        contrat_FINAL_ok.pdf
      </Line>
    </div>
  )
}

/** A path nobody can retrace. The right edge fades because it keeps going. */
function BuriedPath() {
  const t = useT()

  return (
    <div>
      {/* Masked rather than covered with a matching gradient: a mask fades to
          whatever is behind it, so it cannot drift out of sync with the panel
          colour the way a hard-coded overlay would. */}
      <div className="flex items-center gap-1 overflow-hidden font-mono text-meta whitespace-nowrap text-[var(--color-text-subtle)] [mask-image:linear-gradient(90deg,#000_72%,transparent)]">
        {t.problem.artifacts.pathSegments.map((part) => (
          <span key={part} className="flex items-center gap-1">
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">{part}</span>
            <span aria-hidden="true">›</span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-micro text-[var(--color-text-subtle)]">
        {t.problem.artifacts.pathNote}
      </p>
    </div>
  )
}

/** Three files, one truth, no way to tell which. */
function CompetingVersions() {
  const t = useT()

  return (
    <div>
      <Line icon={<FileText size={12} aria-hidden="true" />} note="14:02">
        offre_v3.docx
      </Line>
      <Line icon={<FileText size={12} aria-hidden="true" />} note="14:09">
        offre_v3_final.docx
      </Line>
      <Line icon={<FileText size={12} aria-hidden="true" />} note="14:11">
        offre_v3_final(2).docx
      </Line>
      <p className="mt-1.5 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.problem.artifacts.whichOne}
      </p>
    </div>
  )
}

/** A search that returns nothing, in the wrong folder, again. */
function EmptySearch() {
  const t = useT()

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-black/30 px-2.5 py-1.5">
        <Search size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
        <span className="truncate font-mono text-meta text-[var(--color-text-muted)]">
          {t.problem.artifacts.searchQuery}
        </span>
      </div>
      <p className="mt-2.5 text-micro text-[var(--color-text-subtle)]">
        {t.problem.artifacts.searchNote}
      </p>
    </div>
  )
}

/** The certificate that told nobody. */
function ForgottenExpiry() {
  const t = useT()

  return (
    <div>
      <Line icon={<FileText size={12} aria-hidden="true" />} note="v1">
        attestation_fiscale.pdf
      </Line>
      <Line icon={<Clock size={12} aria-hidden="true" />} tone="warm">
        {t.problem.artifacts.expired}
      </Line>
      <p className="mt-1.5 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.problem.artifacts.expiredNote}
      </p>
    </div>
  )
}

/** A renewal that happened without a decision. */
function SilentRenewal() {
  const t = useT()

  return (
    <div>
      <Line icon={<Repeat size={12} aria-hidden="true" />}>{t.problem.artifacts.maintenance}</Line>
      <Line icon={<Clock size={12} aria-hidden="true" />} tone="warm">
        {t.problem.artifacts.renewed}
      </Line>
      <p className="mt-1.5 border-t border-[var(--color-hairline)] pt-2 text-micro text-[var(--color-text-subtle)]">
        {t.problem.artifacts.renewedNote}
      </p>
    </div>
  )
}

/** An attachment with no boundary on it. */
function UncontrolledShare() {
  const t = useT()

  return (
    <div>
      <Line icon={<Paperclip size={12} aria-hidden="true" />} note="2.4 MB">
        salaires_2026.xlsx
      </Line>
      <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-[var(--color-hairline)] pt-2">
        {t.problem.artifacts.shareTags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-[rgb(245_158_11/0.10)] px-1.5 py-0.5 text-micro text-[var(--color-status-amber)] ring-1 ring-[rgb(245_158_11/0.20)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The access log that was never kept. */
function NoTrail() {
  const t = useT()

  return (
    <div>
      <p className="pb-1.5 text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
        {t.problem.artifacts.accessHistory}
      </p>
      <div className="space-y-1.5 border-t border-[var(--color-hairline)] pt-2">
        {[0, 1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/[0.07]" />
            <span className="h-1.5 flex-1 rounded-full bg-white/[0.05]" />
          </div>
        ))}
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-micro text-[var(--color-text-subtle)]">
        <EyeOff size={12} aria-hidden="true" />
        {t.problem.artifacts.noRecord}
      </p>
    </div>
  )
}

function stages(t: Dict) {
  return [
    {
      name: t.problem.stages.scattered.name,
      warm: false,
      note: t.problem.stages.scattered.note,
      problems: [
        { caption: t.problem.captions.devices, artifact: <ScatteredCopies /> },
        { caption: t.problem.captions.buried, artifact: <BuriedPath /> },
      ],
    },
    {
      name: t.problem.stages.context.name,
      warm: false,
      note: t.problem.stages.context.note,
      problems: [
        { caption: t.problem.captions.versions, artifact: <CompetingVersions /> },
        { caption: t.problem.captions.search, artifact: <EmptySearch /> },
      ],
    },
    {
      name: t.problem.stages.deadlines.name,
      warm: true,
      note: t.problem.stages.deadlines.note,
      problems: [
        { caption: t.problem.captions.expiry, artifact: <ForgottenExpiry /> },
        { caption: t.problem.captions.renewal, artifact: <SilentRenewal /> },
      ],
    },
    {
      name: t.problem.stages.security.name,
      warm: true,
      note: t.problem.stages.security.note,
      problems: [
        { caption: t.problem.captions.sharing, artifact: <UncontrolledShare /> },
        { caption: t.problem.captions.history, artifact: <NoTrail /> },
      ],
    },
  ]
}
