import type { CSSProperties } from 'react'
import { ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { HeroVisual } from './hero/HeroVisual'
import { REGISTER_URL } from '@/lib/links'

export function Hero() {
  return (
    <section className="bg-halo relative isolate overflow-hidden pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
      <Container>
        {/* Centred rather than split: the headline is short and the product
            visual needs the full measure to stay legible. A 50/50 split would
            shrink both. */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="motion-safe:animate-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck size={14} aria-hidden="true" className="text-[var(--color-accent-400)]" />
            Encrypted, versioned, auditable
          </p>

          <h1
            className="motion-safe:animate-rise mt-7 text-display leading-[1.04] text-[var(--color-text)]"
            style={{ '--i': 1 } as CSSProperties}
          >
            Your documents deserve more than a folder.
          </h1>

          <p
            className="motion-safe:animate-rise mx-auto mt-6 max-w-2xl text-lead leading-relaxed text-[var(--color-text-muted)]"
            style={{ '--i': 2 } as CSSProperties}
          >
            KDB Doc Vault gives you one secure place to store, organize, search, share,
            sign, and manage your documents — from the moment they arrive until the
            moment they are archived.
          </p>

          <div
            className="motion-safe:animate-rise mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center"
            style={{ '--i': 3 } as CSSProperties}
          >
            <Button
              href={REGISTER_URL}
              size="lg"
              trailing={<ArrowRight size={18} aria-hidden="true" />}
            >
              Get started
            </Button>
            <Button
              href="#how"
              variant="secondary"
              size="lg"
              icon={<PlayCircle size={18} aria-hidden="true" />}
            >
              See how it works
            </Button>
          </div>

          <p
            className="motion-safe:animate-rise mt-6 text-sm text-[var(--color-text-subtle)]"
            style={{ '--i': 4 } as CSSProperties}
          >
            Secure document management for individuals, teams, and organizations.
          </p>
        </div>
      </Container>

      {/* The visual gets a wider frame than the copy — it is the argument, not
          the decoration. */}
      <Container width="wide" className="mt-14 sm:mt-16 lg:mt-20">
        <div
          className="motion-safe:animate-rise"
          style={{ '--i': 5 } as CSSProperties}
        >
          <HeroVisual />
        </div>
      </Container>
    </section>
  )
}
