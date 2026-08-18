import { cn } from '@/lib/cn'

/**
 * The KDB Doc Vault mark: a hexagonal shield with a vault seam.
 *
 * Drawn as SVG rather than loaded as an image so it inherits colour from
 * context, stays crisp at any size, and costs no request. The shape is the
 * same one the app and favicon use.
 */
export function Logo({
  className,
  showWordmark = true,
  size = 'md',
}: {
  className?: string
  showWordmark?: boolean
  /** `lg` is for the closing call to action, where the mark carries the block. */
  size?: 'md' | 'lg'
}) {
  const large = size === 'lg'
  return (
    <span className={cn('inline-flex items-center', large ? 'gap-4' : 'gap-2.5', className)}>
      <svg
        viewBox="0 0 32 38"
        aria-hidden="true"
        className={cn('w-auto shrink-0', large ? 'h-[52px]' : 'h-[26px]')}
        fill="none"
      >
        <path
          d="M16 1.5 30 9v20L16 36.5 2 29V9L16 1.5Z"
          className="fill-[var(--color-accent-600)]"
        />
        {/* The seam: reads as a vault door without spelling it out. */}
        <path d="M16 1.5V36.5" stroke="rgb(4 7 14 / 0.45)" strokeWidth="1.5" />
        <circle cx="16" cy="19" r="4.25" stroke="rgb(4 7 14 / 0.55)" strokeWidth="1.75" />
      </svg>

      {showWordmark && (
        <span
          className={cn(
            'font-semibold tracking-[-0.02em] text-[var(--color-text)]',
            large ? 'text-h2' : 'text-h4',
          )}
        >
          KDB&nbsp;Doc&nbsp;Vault
        </span>
      )}
    </span>
  )
}
