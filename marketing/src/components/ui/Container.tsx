import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Width = 'default' | 'prose' | 'wide'

const WIDTHS: Record<Width, string> = {
  // The site's measure. 1200px keeps three columns comfortable without
  // stretching body copy past what the eye can track.
  default: 'max-w-[var(--container-site)]',
  // Reading measure for anything long-form — legal text, changelog, blog.
  prose: 'max-w-[var(--container-prose)]',
  // For full-bleed-ish moments: a product shot or a wide table.
  wide: 'max-w-[1440px]',
}

/**
 * Horizontal rhythm for the whole site.
 *
 * The gutter grows with the viewport (20px on a phone, 40px on a desktop)
 * rather than staying fixed — a 20px gutter looks cramped at 1440px and a
 * 40px one wastes a third of a 360px screen.
 */
export function Container({
  children,
  width = 'default',
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  width?: Width
  className?: string
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main'
}) {
  return (
    <Tag className={cn('mx-auto w-full px-5 sm:px-8 lg:px-10', WIDTHS[width], className)}>
      {children}
    </Tag>
  )
}
