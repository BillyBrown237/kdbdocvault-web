import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Ban,
  Check,
  Clock,
  Copy,
  Download,
  Eye,
  Link2,
  Lock,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'

type Level = 'preview' | 'view' | 'comment'
type ExpiryKey = '24h' | '48h' | '7d' | 'never'

const LEVELS: { key: Level; label: string; icon: ReactNode; note: string }[] = [
  {
    key: 'preview',
    label: 'Preview only',
    icon: <Eye size={12} aria-hidden="true" />,
    note: 'Watermarked, in the browser. Downloading is not available at this level.',
  },
  {
    key: 'view',
    label: 'View',
    icon: <Eye size={12} aria-hidden="true" />,
    note: 'Read the document as it is, nothing more.',
  },
  {
    key: 'comment',
    label: 'View & comment',
    icon: <MessageSquare size={12} aria-hidden="true" />,
    note: 'Read it and leave comments, which stay on the document.',
  },
]

const EXPIRIES: { key: ExpiryKey; label: string; phrase: string }[] = [
  { key: '24h', label: '24 hours', phrase: 'in 24 hours' },
  { key: '48h', label: '48 hours', phrase: 'in 48 hours' },
  { key: '7d', label: '7 days', phrase: 'in 7 days' },
  { key: 'never', label: 'No expiry', phrase: 'never' },
]

/**
 * Secure sharing.
 *
 * The dialog works. Choosing an access level, an expiry and the two switches
 * changes the summary beside it in real time, because the argument of this
 * section is that the guarantees are settings rather than promises — and a
 * dead screenshot of a form makes exactly the opposite case.
 *
 * One rule is enforced rather than described: at "Preview only" the download
 * switch is genuinely disabled, not merely ignored. A configurator that lets
 * you pick a combination the product would refuse is worse than no
 * configurator, and this is the cheapest possible way to show that the levels
 * mean something.
 */
export function Sharing() {
  const [level, setLevel] = useState<Level>('view')
  const [expiry, setExpiry] = useState<ExpiryKey>('48h')
  const [password, setPassword] = useState(true)
  const [download, setDownload] = useState(false)

  const previewOnly = level === 'preview'
  const canDownload = previewOnly ? false : download
  const chosenExpiry = EXPIRIES.find((e) => e.key === expiry) ?? EXPIRIES[1]!
  const chosenLevel = LEVELS.find((l) => l.key === level) ?? LEVELS[1]!

  return (
    <Section
      id="sharing"
      tone="raised"
      eyebrow="Secure sharing"
      title="Share a document without losing control of it."
      lead="Give people access to the document they need without giving away everything around it."
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* The dialog. */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] product-sheen">
          <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] px-5 py-3.5">
            <Link2 size={14} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
            <h3 className="text-ui-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              Share document
            </h3>
            <span className="ml-auto font-mono text-meta text-[var(--color-text-subtle)]">
              Contract.pdf
            </span>
          </div>

          <div className="space-y-5 p-5">
            <Field label="Recipient">
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-hairline)] bg-black/25 px-3 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-ink-700)] text-nano font-medium text-[var(--color-text-muted)]">
                  JD
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-ui text-[var(--color-text)]">
                    John Doe
                  </span>
                  <span className="block truncate font-mono text-micro text-[var(--color-text-subtle)]">
                    john.doe@partner.example
                  </span>
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-nano text-[var(--color-text-subtle)]">
                  external
                </span>
              </div>
            </Field>

            <Field label="Access level">
              <Segmented
                options={LEVELS.map((l) => ({ key: l.key, label: l.label, icon: l.icon }))}
                value={level}
                onChange={setLevel}
                name="Access level"
              />
              <p className="mt-2 text-ui-sm leading-snug text-[var(--color-text-subtle)]">
                {chosenLevel.note}
              </p>
            </Field>

            <Field label="Expiration">
              <Segmented
                options={EXPIRIES.map((e) => ({ key: e.key, label: e.label }))}
                value={expiry}
                onChange={setExpiry}
                name="Expiration"
              />
              {expiry === 'never' && (
                <p className="motion-safe:animate-fade mt-2 text-ui-sm leading-snug text-[var(--color-status-amber)]">
                  A link with no expiry is the one nobody remembers to revoke.
                </p>
              )}
            </Field>

            <Switch
              label="Password protection"
              hint="John receives the password separately, not in the same message as the link."
              checked={password}
              onChange={setPassword}
            />

            <Switch
              label="Download permission"
              hint={
                previewOnly
                  ? 'Not available at “Preview only” — the document never leaves the browser.'
                  : 'Every download is recorded in the document’s trail.'
              }
              checked={canDownload}
              onChange={setDownload}
              disabled={previewOnly}
            />

            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-black/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-meta text-[var(--color-text-subtle)]">
                kdb.vault/s/9f2c…a41
              </span>
              <Copy size={12} aria-hidden="true" className="shrink-0 text-[var(--color-text-subtle)]" />
            </div>
          </div>
        </div>

        {/* What that produced. */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[rgb(16_185_129/0.25)] bg-[rgb(16_185_129/0.04)] p-5">
            <p className="flex items-center gap-2 text-card font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              <Check size={14} aria-hidden="true" className="text-[var(--color-accent-400)]" />
              Shared with John Doe
            </p>

            <p
              key={expiry}
              className="motion-safe:animate-fade mt-2 flex items-center gap-1.5 text-ui text-[var(--color-text-muted)]"
            >
              <Clock size={12} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
              {expiry === 'never' ? 'No expiry set' : `Expires ${chosenExpiry.phrase}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip on>{chosenLevel.label}</Chip>
              <Chip on={password} icon={<Lock size={10} aria-hidden="true" />}>
                {password ? 'Password required' : 'No password'}
              </Chip>
              <Chip on={canDownload} icon={<Download size={10} aria-hidden="true" />}>
                {canDownload ? 'Download allowed' : 'Download blocked'}
              </Chip>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
            <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
              What John still cannot do
            </h3>
            {/* The list answers the settings above it. That is the whole
                point of the section: the limits are consequences of choices,
                not a paragraph of reassurance. */}
            <ul className="mt-3 space-y-2.5">
              <Cannot>Browse the folder this document sits in.</Cannot>
              <Cannot>See any other document in your vault.</Cannot>
              <Cannot>
                {expiry === 'never'
                  ? 'Keep access once you revoke the link.'
                  : 'Open the link after it expires.'}
              </Cannot>
              <Cannot>
                {canDownload
                  ? 'Download it without that appearing in the trail.'
                  : 'Save a copy — the document never leaves the browser.'}
              </Cannot>
            </ul>

            <p className="mt-4 flex items-start gap-2 border-t border-[var(--color-hairline)] pt-4 text-ui-sm leading-relaxed text-[var(--color-text-subtle)]">
              <ShieldCheck
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-accent-400)]"
              />
              Revoke the link at any time and it stops working — you don’t have to wait for the
              expiry you set.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ bits */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

/**
 * A group of mutually exclusive choices.
 *
 * `aria-pressed` rather than a tablist: these buttons don't each reveal a
 * panel, they set one value. Radios would be the textbook answer, but radios
 * that look like buttons need their own roving-focus handling to behave, and
 * pressed buttons in a labelled group get read correctly today.
 */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: { key: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-ui-sm transition-colors duration-[var(--duration-fast)]',
              on
                ? 'bg-[rgb(16_185_129/0.12)] text-[var(--color-accent-400)] ring-1 ring-[rgb(16_185_129/0.3)]'
                : 'text-[var(--color-text-muted)] ring-1 ring-[var(--color-hairline)] hover:bg-white/[0.04] hover:text-[var(--color-text)]',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Switch({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-3', disabled && 'opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-[var(--duration-base)]',
          checked ? 'bg-[var(--color-accent-600)]' : 'bg-white/[0.09]',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-white transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)]',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
      <span className="min-w-0">
        <span id={id} className="block text-ui text-[var(--color-text)]">
          {label}
        </span>
        <span className="mt-0.5 block text-ui-sm leading-snug text-[var(--color-text-subtle)]">
          {hint}
        </span>
      </span>
    </div>
  )
}

function Chip({ children, on, icon }: { children: ReactNode; on: boolean; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-meta whitespace-nowrap ring-1',
        on
          ? 'bg-[rgb(16_185_129/0.10)] text-[var(--color-accent-400)] ring-[rgb(16_185_129/0.24)]'
          : 'bg-white/[0.04] text-[var(--color-text-subtle)] ring-[var(--color-hairline)]',
      )}
    >
      {icon}
      {children}
    </span>
  )
}

function Cannot({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-ui leading-relaxed text-[var(--color-text-muted)]">
      <Ban size={14} aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-text-subtle)]" />
      {children}
    </li>
  )
}
