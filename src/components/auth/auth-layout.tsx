import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

/**
 * The auth split: a branded vault panel on the left, the form on the right.
 *
 * Rebuilt to continue the public site rather than diverge from it. The panel
 * is `brand-navy` — the same #0a0f1c the marketing pages sit on — with one
 * emerald accent, a hairline vocabulary and the real logo lockup. Somebody
 * arriving from the marketing site should not feel handed to a different
 * product at the door.
 *
 * Two things were removed on purpose. The panel used to rotate three lines,
 * one of which was an invented statistic ("4,080,000 FCFA of exposure
 * avoided") and another a placeholder testimonial. The public site refuses to
 * invent proof; the login screen is a worse place to do it, because it is the
 * one page a sceptical buyer looks at hardest. What is left is a statement
 * about the product, which is true, and a picture of the product, which is
 * the product.
 *
 * On mobile the panel does not shrink — it goes. The form owns a 375px screen
 * and keeps only the logo above it.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const en = i18n.language.startsWith('en')

  return (
    <div className="flex min-h-screen flex-col bg-brand-navy lg:flex-row">
      {/* Mobile: the logo only. No panel, no truncated proof line — the form
          is why anyone opened this page on a phone. */}
      <header className="flex items-center justify-between px-5 pt-6 lg:hidden">
        <Lockup className="h-7" />
        <LanguageToggle en={en} onChange={(l) => void i18n.changeLanguage(l)} />
      </header>

      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-white/[0.07] p-10 lg:flex xl:p-12">
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

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-6 right-6 hidden lg:block">
          <LanguageToggle en={en} onChange={(l) => void i18n.changeLanguage(l)} />
        </div>
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  )
}

function Lockup({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-lockup.png"
      width={258}
      height={112}
      alt="KDB Doc Vault"
      className={`w-auto ${className ?? ''}`}
    />
  )
}

function LanguageToggle({ en, onChange }: { en: boolean; onChange: (l: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(en ? 'fr' : 'en')}
      aria-label="Langue / Language"
      className="rounded-md px-2 py-1 font-mono text-[11px] tracking-widest text-slate-400 transition-colors hover:text-slate-200"
    >
      <span className={en ? '' : 'font-semibold text-white'}>FR</span>
      <span className="text-slate-600"> / </span>
      <span className={en ? 'font-semibold text-white' : ''}>EN</span>
    </button>
  )
}

/**
 * The product, not an illustration.
 *
 * Three document rows carrying the things this application actually tracks —
 * a signature, an expiry, a version — drawn with the same hairlines and
 * status colours the app uses. Static: a login screen is not the place for
 * something that moves while you are typing a password.
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
