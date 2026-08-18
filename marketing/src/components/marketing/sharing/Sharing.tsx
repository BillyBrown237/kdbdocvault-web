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
import { useT, type Dict } from '@/i18n'

type Level = 'preview' | 'view' | 'comment'
type ExpiryKey = '24h' | '48h' | '7d' | 'never'

/** The keys are state, not copy — only the labels and notes are translated. */
function levels(t: Dict): { key: Level; label: string; icon: ReactNode; note: string }[] {
  return [
    {
      key: 'preview',
      label: t.sharing.levels.preview.label,
      icon: <Eye size={12} aria-hidden="true" />,
      note: t.sharing.levels.preview.note,
    },
    {
      key: 'view',
      label: t.sharing.levels.view.label,
      icon: <Eye size={12} aria-hidden="true" />,
      note: t.sharing.levels.view.note,
    },
    {
      key: 'comment',
      label: t.sharing.levels.comment.label,
      icon: <MessageSquare size={12} aria-hidden="true" />,
      note: t.sharing.levels.comment.note,
    },
  ]
}

function expiries(t: Dict): { key: ExpiryKey; label: string; phrase: string }[] {
  return [
    { key: '24h', label: t.sharing.expiries.h24.label, phrase: t.sharing.expiries.h24.phrase },
    { key: '48h', label: t.sharing.expiries.h48.label, phrase: t.sharing.expiries.h48.phrase },
    { key: '7d', label: t.sharing.expiries.d7.label, phrase: t.sharing.expiries.d7.phrase },
    {
      key: 'never',
      label: t.sharing.expiries.never.label,
      phrase: t.sharing.expiries.never.phrase,
    },
  ]
}

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
  const t = useT()
  const [level, setLevel] = useState<Level>('view')
  const [expiry, setExpiry] = useState<ExpiryKey>('48h')
  const [password, setPassword] = useState(true)
  const [download, setDownload] = useState(false)

  const LEVELS = levels(t)
  const EXPIRIES = expiries(t)

  const previewOnly = level === 'preview'
  const canDownload = previewOnly ? false : download
  const chosenExpiry = EXPIRIES.find((e) => e.key === expiry) ?? EXPIRIES[1]!
  const chosenLevel = LEVELS.find((l) => l.key === level) ?? LEVELS[1]!

  return (
    <Section
      id="sharing"
      tone="raised"
      eyebrow={t.sharing.eyebrow}
      title={t.sharing.title}
      lead={t.sharing.lead}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* The dialog. */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] product-sheen">
          <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] px-5 py-3.5">
            <Link2 size={14} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
            <h3 className="text-ui-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
              {t.sharing.dialogTitle}
            </h3>
            <span className="ml-auto font-mono text-meta text-[var(--color-text-subtle)]">
              Contract.pdf
            </span>
          </div>

          <div className="space-y-5 p-5">
            <Field label={t.sharing.fields.recipient}>
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
                  {t.sharing.external}
                </span>
              </div>
            </Field>

            <Field label={t.sharing.fields.accessLevel}>
              <Segmented
                options={LEVELS.map((l) => ({ key: l.key, label: l.label, icon: l.icon }))}
                value={level}
                onChange={setLevel}
                name={t.sharing.fields.accessLevel}
              />
              <p className="mt-2 text-ui-sm leading-snug text-[var(--color-text-subtle)]">
                {chosenLevel.note}
              </p>
            </Field>

            <Field label={t.sharing.fields.expiration}>
              <Segmented
                options={EXPIRIES.map((e) => ({ key: e.key, label: e.label }))}
                value={expiry}
                onChange={setExpiry}
                name={t.sharing.fields.expiration}
              />
              {expiry === 'never' && (
                <p className="motion-safe:animate-fade mt-2 text-ui-sm leading-snug text-[var(--color-status-amber)]">
                  {t.sharing.neverWarning}
                </p>
              )}
            </Field>

            <Switch
              label={t.sharing.password.label}
              hint={t.sharing.password.hint}
              checked={password}
              onChange={setPassword}
            />

            <Switch
              label={t.sharing.download.label}
              hint={previewOnly ? t.sharing.download.hintPreview : t.sharing.download.hintOn}
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
              {t.sharing.sharedWith}
            </p>

            <p
              key={expiry}
              className="motion-safe:animate-fade mt-2 flex items-center gap-1.5 text-ui text-[var(--color-text-muted)]"
            >
              <Clock size={12} aria-hidden="true" className="text-[var(--color-text-subtle)]" />
              {expiry === 'never'
                ? t.sharing.noExpirySet
                : `${t.sharing.expiresPrefix}${chosenExpiry.phrase}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip on>{chosenLevel.label}</Chip>
              <Chip on={password} icon={<Lock size={10} aria-hidden="true" />}>
                {password ? t.sharing.chips.passwordOn : t.sharing.chips.passwordOff}
              </Chip>
              <Chip on={canDownload} icon={<Download size={10} aria-hidden="true" />}>
                {canDownload ? t.sharing.chips.downloadOn : t.sharing.chips.downloadOff}
              </Chip>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-card)]/60 p-5">
            <h3 className="text-micro tracking-[0.1em] text-[var(--color-text-subtle)] uppercase">
              {t.sharing.cannotTitle}
            </h3>
            {/* The list answers the settings above it. That is the whole
                point of the section: the limits are consequences of choices,
                not a paragraph of reassurance. */}
            <ul className="mt-3 space-y-2.5">
              <Cannot>{t.sharing.cannot.browse}</Cannot>
              <Cannot>{t.sharing.cannot.others}</Cannot>
              <Cannot>
                {expiry === 'never' ? t.sharing.cannot.afterRevoke : t.sharing.cannot.afterExpiry}
              </Cannot>
              <Cannot>
                {canDownload ? t.sharing.cannot.downloadTracked : t.sharing.cannot.save}
              </Cannot>
            </ul>

            <p className="mt-4 flex items-start gap-2 border-t border-[var(--color-hairline)] pt-4 text-ui-sm leading-relaxed text-[var(--color-text-subtle)]">
              <ShieldCheck
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-accent-400)]"
              />
              {t.sharing.revoke}
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
