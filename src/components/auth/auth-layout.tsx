import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * The auth split (W23, per the auth design prompt): left is the vault — a
 * Deep Navy proof panel (rotating category line / gold stat / testimonial
 * slot, security line, dial motif) — right is the form. On mobile the
 * panel collapses to a compact navy header; the form owns the screen.
 *
 * The left panel is the brand's handshake: real statements, no decoration
 * for its own sake, and it must survive being screenshotted alone.
 */

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={compact ? 'block h-5 w-4 bg-brand-blue-deep' : 'block h-6 w-5 bg-brand-blue-deep'}
        style={{ clipPath: 'polygon(50% 0,100% 22%,100% 64%,50% 100%,0 64%,0 22%)' }}
      />
      <span className={compact ? 'text-base font-semibold' : 'text-lg font-semibold'}>
        <span className="text-white">KDB</span>
        <span className="bg-brand-gradient bg-clip-text text-transparent">DocVault</span>
      </span>
    </span>
  )
}

function ProofRotator() {
  const { t } = useTranslation()
  const lines = [
    { key: 'auth.proof.category', gold: false },
    { key: 'auth.proof.stat', gold: true },
    { key: 'auth.proof.testimonial', gold: false },
  ]
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIdx((i) => (i + 1) % lines.length), 8000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lines is static
  }, [])

  return (
    <div className="relative min-h-32">
      {lines.map((l, i) => (
        <p
          key={l.key}
          aria-hidden={i !== idx}
          className={`absolute inset-0 max-w-md text-2xl leading-snug font-medium transition-opacity duration-700 ${
            i === idx ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${l.gold ? 'text-brand-gold' : 'text-white'}`}
        >
          {t(l.key)}
        </p>
      ))}
    </div>
  )
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const en = i18n.language.startsWith('en')

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile: compact navy header. */}
      <header className="bg-brand-gradient-dark flex items-center justify-between px-5 py-4 lg:hidden">
        <Wordmark compact />
        <p className="max-w-[46%] truncate text-right text-xs text-slate-400">
          {t('auth.proof.category')}
        </p>
      </header>

      {/* Desktop: the vault panel. */}
      <aside className="bg-brand-gradient-dark relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex">
        <Wordmark />
        <ProofRotator />
        <div className="relative z-10">
          <p className="font-mono text-[11.5px] tracking-widest text-slate-400 uppercase">
            {t('auth.securityLine')}
          </p>
        </div>
        {/* Vault-dial motif — radial ticks, low opacity, pure CSS. */}
        <div
          aria-hidden
          className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full opacity-[.14]"
          style={{
            background:
              'repeating-conic-gradient(rgba(56,189,248,.9) 0deg 1.2deg, transparent 1.2deg 24deg)',
            maskImage: 'radial-gradient(circle, transparent 38%, black 40%, black 70%, transparent 72%)',
            WebkitMaskImage:
              'radial-gradient(circle, transparent 38%, black 40%, black 70%, transparent 72%)',
          }}
        />
      </aside>

      {/* The form panel. */}
      <main className="relative flex flex-1 items-center justify-center bg-slate-50 p-4 py-10">
        <button
          type="button"
          onClick={() => void i18n.changeLanguage(en ? 'fr' : 'en')}
          aria-label="Langue / Language"
          className="absolute top-4 right-5 font-mono text-xs tracking-widest text-slate-500"
        >
          <span className={en ? 'text-slate-400' : 'font-semibold text-slate-900'}>FR</span>
          <span className="text-slate-300"> / </span>
          <span className={en ? 'font-semibold text-slate-900' : 'text-slate-400'}>EN</span>
        </button>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
