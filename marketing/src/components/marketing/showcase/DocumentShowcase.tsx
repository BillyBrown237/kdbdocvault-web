import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Download, Ellipsis, FileText, Share2, ShieldCheck } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { useT, type Dict } from '@/i18n'
import { doc, versions, type Version } from './document'
import {
  ActivityPanel,
  OverviewPanel,
  PermissionsPanel,
  VersionsPanel,
  WorkflowPanel,
} from './panels'

/**
 * These stay English in both locales: they are the state key, the `id` on each
 * tab and the `aria-labelledby` the panel points at. The visible label comes
 * from the dictionary, via `tabLabels`.
 */
const TABS = ['Overview', 'Versions', 'Activity', 'Permissions', 'Workflow'] as const
type Tab = (typeof TABS)[number]

function tabLabels(t: Dict): Record<Tab, string> {
  return {
    Overview: t.showcase.tabs.overview,
    Versions: t.showcase.tabs.versions,
    Activity: t.showcase.tabs.activity,
    Permissions: t.showcase.tabs.permissions,
    Workflow: t.showcase.tabs.workflow,
  }
}

const PANEL_ID = 'doc-panel'

/**
 * The document detail view.
 *
 * Unlike the hero — a picture of the product, deliberately inert — this one is
 * the product: the tabs switch, the versions select, the permission preview
 * changes. So it has to behave like software rather than resemble it. Hence
 * the full ARIA tabs contract: roving tabindex, arrow keys, Home/End, and
 * `aria-controls` on the selected tab only, since only its panel is mounted.
 *
 * On a narrow screen the interface is rearranged, not shrunk. The metadata
 * rail — a column on the right from `md` up — becomes a two-column summary
 * grid directly under the title, where it is read first instead of last; the
 * tab strip scrolls with snap points and a fading right edge; and each panel
 * reflows internally (the workflow turns vertical, version rows drop their
 * size column, the overview stacks its preview above the fields).
 */
export function DocumentShowcase() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('Overview')
  const [version, setVersion] = useState<Version>(versions(t)[0] as Version)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const labels = tabLabels(t)

  const onTabKeyDown = (e: KeyboardEvent) => {
    const current = TABS.indexOf(tab)
    let next = current

    if (e.key === 'ArrowRight') next = (current + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return

    e.preventDefault()
    const name = TABS[next]
    if (!name) return
    setTab(name)
    // Moving focus also scrolls the tab into view on a narrow screen, so the
    // one being operated is never the one hidden under the edge fade.
    tabRefs.current[next]?.focus()
  }

  const meta = metaFor(t, version)

  return (
    <Section
      id="features"
      // `raised`, because HowItWorks above it is `seam` — see the tone note in
      // Home.tsx.
      tone="raised"
      eyebrow={t.showcase.eyebrow}
      title={t.showcase.title}
      lead={t.showcase.lead}
    >
      <div className="product-sheen overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] shadow-frame">
        <Header version={version} />

        {/* The metadata rail, transformed: a grid of pairs above the content on
            a phone, a column beside it from `md`. Same data, different shape —
            and on the small screen it comes first, because a summary is more
            use than a tab strip when there is no room for both. */}
        <dl className="grid grid-cols-2 gap-px border-b border-[var(--color-hairline)] bg-[var(--color-hairline)] md:hidden">
          {meta.map((m) => (
            <div key={m.label} className="bg-[var(--color-surface)] px-4 py-3">
              <dt className="text-nano tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
                {m.label}
              </dt>
              <dd className="mt-1 truncate text-ui text-[var(--color-text)]">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="md:grid md:grid-cols-[1fr_15rem]">
          <div className="min-w-0">
            <div className="relative border-b border-[var(--color-hairline)]">
              <div
                role="tablist"
                aria-label={t.showcase.tablist}
                onKeyDown={onTabKeyDown}
                className="flex snap-x gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {TABS.map((name, i) => {
                  const selected = name === tab
                  return (
                    <button
                      key={name}
                      ref={(el) => {
                        tabRefs.current[i] = el
                      }}
                      role="tab"
                      id={`doc-tab-${name}`}
                      aria-selected={selected}
                      aria-controls={selected ? PANEL_ID : undefined}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setTab(name)}
                      className={cn(
                        'relative shrink-0 scroll-ml-2 snap-start px-3 py-3 text-ui whitespace-nowrap transition-colors duration-[var(--duration-fast)]',
                        selected
                          ? 'text-[var(--color-text)]'
                          : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]',
                      )}
                    >
                      {labels[name]}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity duration-[var(--duration-base)]',
                          selected ? 'bg-[var(--color-accent-500)] opacity-100' : 'opacity-0',
                        )}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Signals that the strip scrolls. An overlay rather than a mask:
                  a mask clips its element's focus ring too. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-[linear-gradient(90deg,transparent,var(--color-surface))] md:hidden"
              />
            </div>

            {/* Only the selected panel is mounted, so `min-h` holds the frame
                still — otherwise every tab change resizes the page under the
                visitor's cursor. */}
            <div
              role="tabpanel"
              id={PANEL_ID}
              aria-labelledby={`doc-tab-${tab}`}
              tabIndex={0}
              key={tab}
              className="motion-safe:animate-fade min-h-[22rem] p-4 sm:p-5"
            >
              {tab === 'Overview' && <OverviewPanel version={version} />}
              {tab === 'Versions' && <VersionsPanel version={version} onSelect={setVersion} />}
              {tab === 'Activity' && <ActivityPanel />}
              {tab === 'Permissions' && <PermissionsPanel />}
              {tab === 'Workflow' && <WorkflowPanel />}
            </div>
          </div>

          <aside className="hidden border-l border-[var(--color-hairline)] p-4 md:block">
            <dl className="space-y-4">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="text-nano tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
                    {m.label}
                  </dt>
                  <dd className="mt-1 text-ui text-[var(--color-text)]">{m.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-[var(--color-hairline)] pt-4">
              <p className="flex items-start gap-1.5 text-meta leading-snug text-[var(--color-text-subtle)]">
                <ShieldCheck
                  size={12}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-accent-400)]"
                />
                {t.showcase.doc.retention}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <p className="mt-4 text-center text-ui-sm text-[var(--color-text-subtle)]">
        {t.showcase.hint}
      </p>
    </Section>
  )
}

function metaFor(t: Dict, version: Version) {
  const d = doc(t)
  return [
    { label: t.showcase.meta.status, value: t.showcase.doc.active },
    { label: t.showcase.meta.owner, value: d.owner },
    { label: t.showcase.meta.created, value: d.created },
    { label: t.showcase.meta.expires, value: d.expires },
    { label: t.showcase.meta.version, value: version.label },
    { label: t.showcase.meta.access, value: d.access },
  ]
}

function Header({ version }: { version: Version }) {
  const t = useT()
  const d = doc(t)

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] px-4 py-4 sm:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-[var(--color-hairline)]">
        <FileText size={16} aria-hidden="true" className="text-[var(--color-text-muted)]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="truncate text-card font-semibold tracking-[-0.01em] text-[var(--color-text)]">
            {d.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgb(16_185_129/0.10)] px-2 py-0.5 text-micro text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.22)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-400)]" />
            {t.showcase.doc.active}
          </span>
          {/* Re-keyed so picking a version in the Versions tab visibly lands
              here — the header is how you know the switch took effect. */}
          <span
            key={version.id}
            className="motion-safe:animate-fade shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-micro text-[var(--color-text-muted)]"
          >
            {version.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-ui-sm text-[var(--color-text-subtle)]">
          {d.subtitle} · {d.owner}
        </p>
      </div>

      {/* Decorative chrome. Real buttons here would be focus stops that do
          nothing — the interactive parts of this mock are the ones that
          actually respond. */}
      <div aria-hidden="true" className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {[Share2, Download, Ellipsis].map((Icon, i) => (
          <span
            key={i}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-text-subtle)] ring-1 ring-[var(--color-hairline)]"
          >
            <Icon size={14} />
          </span>
        ))}
      </div>
    </div>
  )
}
