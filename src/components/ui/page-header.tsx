import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The top of every page.
 *
 * Twenty routes had each rolled their own `<h1 className="text-2xl font-bold">`
 * with a different margin under it, which is most of why the app read as
 * unfinished: nothing lined up from screen to screen. One component fixes the
 * whole set, and new pages inherit the rhythm instead of guessing at it.
 *
 * `description` is for a sentence that helps someone who just arrived, not a
 * paragraph — if it needs two lines it belongs in the page body.
 */
/**
 * The chrome for a "back" control, as a class rather than a component.
 *
 * Detail pages need either a `<Link>` (so middle-click and copy-link work) or a
 * `<button>` (for history.back()). A component would have to pick one; a class
 * lets each page use the right element and still look identical.
 */
export const backControlClass =
  'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring grid size-9 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none'

export function PageHeader({
  back,
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  /** A control rendered before the icon — see {@link backControlClass}. */
  back?: React.ReactNode
  /**
   * Passed as the component, not as JSX, so the size and colour are decided
   * here. Every page that rendered its own icon had picked its own `h-5 w-5
   * text-muted-foreground`, which is fine until one of them doesn't.
   */
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  /** Primary action for the page. Right-aligned on desktop, wraps below on a phone. */
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {back}
        {Icon && (
          <span
            aria-hidden
            className="bg-primary/10 text-primary ring-primary/10 grid size-10 shrink-0 place-items-center rounded-xl ring-1"
          >
            <Icon className="size-[1.15rem]" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 truncate text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A titled block within a page — the level below PageHeader.
 *
 * Exists so sections stop being bare `<h2>`s with ad-hoc spacing, which is the
 * same drift PageHeader solves one level up.
 */
export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
