import type { ReactNode } from 'react'
import { Container } from './Container'
import { cn } from '@/lib/cn'

type Tone = 'page' | 'raised' | 'seam'
type Space = 'default' | 'tight' | 'loose'

const TONES: Record<Tone, string> = {
  page: '',
  // One step up from the page. Alternating this with `page` gives the site
  // rhythm without drawing a rule between every section.
  raised: 'bg-[var(--color-surface)]',
  // Keeps the page colour but marks the join with a fading hairline —
  // quieter than a surface change when two sections belong together.
  seam: 'border-t border-[var(--color-hairline)]',
}

const SPACES: Record<Space, string> = {
  default: 'py-20 sm:py-24 lg:py-32',
  tight: 'py-14 sm:py-16 lg:py-20',
  loose: 'py-24 sm:py-32 lg:py-40',
}

/**
 * A page section: vertical rhythm, optional surface, optional heading block.
 *
 * Sections take an `id` and render `aria-labelledby` against their own
 * heading, so the page is navigable as a document — landmarks with names,
 * not a stack of anonymous divs.
 */
export function Section({
  children,
  id,
  tone = 'page',
  space = 'default',
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: {
  children?: ReactNode
  id?: string
  tone?: Tone
  space?: Space
  /** Short label above the title. Sentence case, no shouting. */
  eyebrow?: string
  title?: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  const headingId = id ? `${id}-title` : undefined
  const centered = align === 'center'

  return (
    <section
      id={id}
      aria-labelledby={title && headingId ? headingId : undefined}
      className={cn('relative', TONES[tone], SPACES[space], className)}
    >
      <Container>
        {(eyebrow || title || lead) && (
          <header className={cn('max-w-3xl', centered && 'mx-auto text-center')}>
            {eyebrow && (
              <p className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--color-accent-400)] uppercase">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 id={headingId} className="text-h2 text-[var(--color-text)]">
                {title}
              </h2>
            )}
            {lead && (
              <p
                className={cn(
                  'mt-5 text-lead leading-relaxed text-[var(--color-text-muted)]',
                  centered && 'mx-auto',
                )}
              >
                {lead}
              </p>
            )}
          </header>
        )}

        {/* Only pay for the gap when there is both a header and content. */}
        {children && <div className={cn(eyebrow || title || lead ? 'mt-14 lg:mt-16' : '')}>{children}</div>}
      </Container>
    </section>
  )
}
