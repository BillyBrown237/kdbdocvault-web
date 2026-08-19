import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

/**
 * The auth split: a branded vault panel on the left, the form on the right.
 *
 * ── Why the form panel is light ──────────────────────────────────────────
 * An earlier pass made the whole screen navy to echo the marketing site. That
 * broke it. `Input` is `bg-transparent` and inherits `--foreground`, which in
 * this application's light theme is near-black — so every character typed into
 * a field was black-on-navy and invisible. The same applied to `Label`,
 * `Callout` and `Button` variants, and not only here: SIX routes render this
 * layout — login, register, forgot-password, mfa, onboarding, reset-password —
 * so one background change silently broke five screens nobody had looked at.
 *
 * The rule this leaves behind: the panel is ours to brand, the form side
 * belongs to the design system. Anything inside `{children}` must keep working
 * with the app's semantic tokens, untouched. Do not hard-code `text-white`
 * there.
 *
 * ── What was removed ─────────────────────────────────────────────────────
 * The panel used to rotate three lines, one an invented statistic
 * ("4,080,000 FCFA of exposure avoided") and one a placeholder testimonial.
 * The public site refuses to invent proof and a login screen is a worse place
 * to do it. What is left is a true statement and a picture of the product.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const en = i18n.language.startsWith('en')

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile: a compact branded bar, then the form owns the screen. The
          panel is not shrunk onto a phone — it is dropped. */}
      <header className="flex items-center justify-between bg-brand-navy px-5 py-4 lg:hidden">
        <Lockup className="h-6" />
        <LanguageToggle en={en} onChange={(l) => void i18n.changeLanguage(l)} dark />
      </header>

      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-brand-navy p-10 lg:flex xl:p-12">
        {/* One ambient light, thrown from above, as on the marketing hero. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(42% 55% at 18% 0%, rgb(16 185 129 / 0.10), transparent 70%), radial-gradient(38% 50% at 82% 8%, rgb(30 64 175 / 0.14), transparent 72%)',
          }}
        />

        <Lockup className="relative z-10 h-8" />

        <div className="relative z-10">
          <p className="max-w-md text-2xl leading-snug font-semibold tracking-[-0.02em] text-white">
            {t('auth.panel.statement')}
          </p>
          <VaultVisual />
        </div>

        <p className="relative z-10 font-mono text-[11.5px] tracking-widest text-slate-400 uppercase">
          {t('auth.securityLine')}
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="absolute top-5 right-6 hidden lg:block">
          <LanguageToggle en={en} onChange={(l) => void i18n.changeLanguage(l)} />
        </div>
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  )
}

/**
 * The logo lockup.
 *
 * `self-start` is load-bearing. Both containers above are `flex-col`, whose
 * default `align-items: stretch` pulls a block-level `<img>` out to the full
 * column width — with the height pinned by `h-8`, that squashed the artwork
 * flat. `w-auto` alone does not save it, because stretch sets the used width
 * directly.
 */
function Lockup({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-lockup.png"
      width={258}
      height={112}
      alt="KDB Doc Vault"
      className={`w-auto shrink-0 self-start object-contain ${className ?? ''}`}
    />
  )
}

function LanguageToggle({
  en,
  onChange,
  dark = false,
}: {
  en: boolean
  onChange: (l: string) => void
  dark?: boolean
}) {
  const idle = dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
  const active = dark ? 'font-semibold text-white' : 'font-semibold text-slate-900'

  return (
    <button
      type="button"
      onClick={() => onChange(en ? 'fr' : 'en')}
      aria-label="Langue / Language"
      className={`rounded-md px-2 py-1 font-mono text-[11px] tracking-widest transition-colors ${idle}`}
    >
      <span className={en ? '' : active}>FR</span>
      <span className={dark ? 'text-slate-600' : 'text-slate-300'}> / </span>
      <span className={en ? active : ''}>EN</span>
    </button>
  )
}

/**
 * The product, not an illustration.
 *
 * Three document rows carrying what this application actually tracks — a
 * signature, an expiry, a retention rule — in the app's own status colours.
 * Static: a login screen is not the place for something that moves while
 * somebody is typing a password.
 */
function VaultVisual() {
  const rows = [
    { name: 'Master services agreement', meta: 'v4 · signed', tone: 'text-emerald-400' },
    { name: 'Tax clearance certificate', meta: 'expires in 12 days', tone: 'text-amber-400' },
    { name: 'Board minutes — Q1', meta: 'archived · retained 10 y', tone: 'text-slate-400' },
  ]

  return (
    <div aria-hidden className="mt-10 max-w-sm space-y-2">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
        >
          <span className="grid h-8 w-6 shrink-0 content-start gap-[3px] rounded-sm bg-slate-200/90 p-1.5">
            {[100, 70, 90].map((w, i) => (
              <span
                key={i}
                className="h-[2px] rounded-full bg-slate-400/70"
                style={{ width: `${w}%` }}
              />
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] text-slate-200">{row.name}</span>
            <span className={`block font-mono text-[10px] ${row.tone}`}>{row.meta}</span>
          </span>
        </div>
      ))}

      <p className="flex items-center gap-1.5 pt-2 text-[11px] text-slate-500">
        <ShieldCheck className="h-3 w-3 text-emerald-400" />
        {/* Deliberately the same claim the public site makes, and no more. */}
        Encrypted at rest · every version kept
      </p>
    </div>
  )
}
