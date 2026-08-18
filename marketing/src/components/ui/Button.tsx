import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] ' +
  'duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  // Motion is a nicety; the colour change carries the state on its own.
  'motion-safe:active:translate-y-px'

const VARIANTS: Record<Variant, string> = {
  // The only emerald surface on any given screen. If a second one appears,
  // one of them is not the primary action.
  primary:
    'bg-[var(--color-accent-600)] text-white shadow-[0_1px_0_rgb(255_255_255/0.14)_inset] ' +
    'hover:bg-[var(--color-accent-500)]',
  secondary:
    'border border-[var(--color-hairline-strong)] bg-white/[0.02] text-[var(--color-text)] ' +
    'hover:border-[var(--color-hairline-strong)] hover:bg-white/[0.06]',
  ghost: 'text-[var(--color-text-muted)] hover:bg-white/[0.05] hover:text-[var(--color-text)]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  // 44px: the minimum comfortable touch target, so the default size is
  // already thumb-safe without a mobile override.
  md: 'h-11 px-5 text-card',
  lg: 'h-12 px-6 text-base',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
  /** Rendered before the label; pass a Lucide icon at 16–18px. */
  icon?: ReactNode
  /** Rendered after the label — arrows, external-link marks. */
  trailing?: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof CommonProps> & { href?: never }

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof CommonProps> & { href: string }

/**
 * The site's only button.
 *
 * Renders an `<a>` when given `href` and a `<button>` otherwise — because a
 * thing that navigates must be a link (middle-click, open in new tab, and
 * "Links" in a screen reader's element list all depend on it), and a thing
 * that acts must be a button. Styling them identically is a visual decision;
 * making them the same element is a bug.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    size = 'md',
    children,
    className,
    icon,
    trailing,
    ...rest
  } = props

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if ('href' in rest && rest.href !== undefined) {
    const { href, target, rel, ...anchorRest } = rest as ComponentPropsWithoutRef<'a'>
    return (
      <a
        href={href}
        target={target}
        // noopener is a security requirement, not a preference: without it the
        // opened page can reach back through window.opener.
        rel={target === '_blank' ? cn('noopener noreferrer', rel) : rel}
        className={classes}
        {...anchorRest}
      >
        {icon}
        {children}
        {trailing}
      </a>
    )
  }

  const { type = 'button', ...buttonRest } = rest as ComponentPropsWithoutRef<'button'>
  return (
    <button type={type} className={classes} {...buttonRest}>
      {icon}
      {children}
      {trailing}
    </button>
  )
}
