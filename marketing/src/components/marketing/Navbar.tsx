import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, Ref } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Logo } from './Logo'
import { cn } from '@/lib/cn'
import { LOGIN_URL, REGISTER_URL } from '@/lib/links'

/**
 * `href` is optional, as in the footer: Resources has no destination yet, and
 * a nav item that scrolls nowhere is worse than one that plainly isn't ready.
 * Give it an href the day the page exists.
 */
const LINKS: { href?: string; label: string }[] = [
  { href: '#solution', label: 'Product' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#security', label: 'Security' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { label: 'Resources' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Transparent over the hero, surfaced once the page moves under it — so the
  // header never draws a line across an empty screen.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Closing the sheet must return focus to the control that opened it.
  // Without this, Escape drops a keyboard user at the top of the document with
  // no idea where they are.
  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key !== 'Tab') return

      // The sheet covers the viewport, so focus must not escape behind it.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)

    // The sheet scrolls on its own; the page behind it must not.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  // A sheet still open behind a rotated phone is a trap.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-soft)]',
        scrolled || open
          ? 'border-b border-[var(--color-hairline)] bg-[var(--color-page)]/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {/* First focusable element on the page. */}
      <a
        href="#main"
        className="sr-only focusable-sr top-3 left-3 z-60 rounded-lg bg-[var(--color-accent-600)] px-4 py-2 text-sm font-medium text-white"
      >
        Skip to content
      </a>

      <Container as="nav" className="flex h-16 items-center gap-6 lg:h-[4.5rem]">
        <a href="/" className="shrink-0 rounded-sm" aria-label="KDB Doc Vault — home">
          <Logo />
        </a>

        <ul className="mx-auto hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              {l.href ? (
                <a
                  href={l.href}
                  className="block rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                >
                  {l.label}
                </a>
              ) : (
                <span className="block px-3 py-2 text-sm text-[var(--color-text-subtle)]">
                  {l.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button href={LOGIN_URL} variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button href={REGISTER_URL} size="sm" className="hidden sm:inline-flex">
            Get started
          </Button>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => (open ? close() : setOpen(true))}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)] lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {open && <MobileNav id="mobile-nav" ref={panelRef} onNavigate={() => setOpen(false)} />}
    </header>
  )
}

/**
 * The mobile sheet.
 *
 * A full-height surface rather than a dropdown, because on a phone this IS the
 * navigation — it gets the whole screen, room to breathe, a short description
 * under each destination, and its own call to action pinned at the bottom
 * where a thumb reaches. A cramped list of six links under the header would
 * read as an afterthought, which is precisely what it must not be.
 */
function MobileNav({
  id,
  ref,
  onNavigate,
}: {
  id: string
  ref: Ref<HTMLDivElement>
  onNavigate: () => void
}) {
  return (
    <div
      id={id}
      ref={ref}
      className="motion-safe:animate-fade fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-[var(--color-hairline)] bg-[var(--color-page)] lg:hidden"
    >
      <Container className="flex min-h-full flex-col py-6">
        <ul className="flex flex-col gap-1">
          {LINKS.map((l, i) => (
            <li
              key={l.label}
              className="motion-safe:animate-rise"
              style={{ '--i': i } as CSSProperties}
            >
              {l.href ? (
                <a
                  href={l.href}
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-xl px-4 py-4 text-lg font-medium text-[var(--color-text)] transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                >
                  {l.label}
                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                    className="text-[var(--color-text-subtle)]"
                  />
                </a>
              ) : (
                <span className="flex items-center px-4 py-4 text-lg font-medium text-[var(--color-text-subtle)]">
                  {l.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <div className="h-px divider-fade" />
          <div className="mt-6 flex flex-col gap-3">
            <Button href={REGISTER_URL} size="lg" onClick={onNavigate}>
              Get started
            </Button>
            <Button href={LOGIN_URL} variant="secondary" size="lg" onClick={onNavigate}>
              Sign in
            </Button>
          </div>
          <p className="mt-6 pb-2 text-center text-sm text-[var(--color-text-subtle)]">
            Secure document management for individuals, teams, and organizations.
          </p>
        </div>
      </Container>
    </div>
  )
}
