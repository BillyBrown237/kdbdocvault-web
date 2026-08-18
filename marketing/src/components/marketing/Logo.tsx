import { cn } from '@/lib/cn'
import { useT } from '@/i18n'

/**
 * The brand mark, from the real artwork.
 *
 * This used to be a hand-drawn SVG hexagon standing in for a logo nobody had
 * supplied yet. The actual files are now in `public/`, so the placeholder is
 * gone.
 *
 * `public/logo.png` and `public/app-icon.png` are 2000×2000 masters on an
 * opaque navy canvas — they cannot go on the page as they are, because the
 * navbar is transparent over the hero and a 370 kB square would show as a dark
 * rectangle sitting on the halo. `public/brand/` holds the web versions: the
 * canvas flood-filled to transparency from the edges, cropped to the artwork,
 * and resized to 112px tall — 2× the largest place either is used. Regenerate
 * them from the masters, not from these.
 *
 *   brand/logo-lockup.png   258×112   mark + wordmark, for the navbar
 *   brand/logo-mark.png      83×112   the shield alone
 *
 * `width`/`height` are set from the intrinsic pixels while CSS sets only the
 * height, so the browser reserves the right box before the image arrives and
 * the header does not jump.
 */

const LOCKUP = { src: '/brand/logo-lockup.png', width: 258, height: 112 }
const MARK = { src: '/brand/logo-mark.png', width: 83, height: 112 }

export function Logo({
  className,
  showWordmark = true,
  size = 'md',
  /**
   * `true` where the logo sits inside something already labelled — the
   * navbar's home link carries its own `aria-label`, so an alt here would be
   * read twice.
   */
  decorative = false,
  /** The navbar's logo is above the fold and must not be deferred. */
  eager = false,
}: {
  className?: string
  showWordmark?: boolean
  size?: 'md' | 'lg'
  decorative?: boolean
  eager?: boolean
}) {
  const t = useT()
  const art = showWordmark ? LOCKUP : MARK

  return (
    <img
      src={art.src}
      width={art.width}
      height={art.height}
      alt={decorative ? '' : t.nav.brand}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('w-auto shrink-0', size === 'lg' ? 'h-14' : 'h-7', className)}
    />
  )
}
