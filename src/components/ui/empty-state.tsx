import { FileText, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * "There is nothing here" — said once, in one voice (W34).
 *
 * The app had two ways of saying it: a dashed box in the vault, and a dozen
 * hand-written `<p className="py-6 text-center text-sm text-muted-foreground">`
 * inside cards. The paragraph version is the problem — a lone grey sentence
 * where content should be looks like a component that failed to load, not like
 * a state the app meant to show you.
 *
 * Two sizes, because the two situations really are different:
 *
 *  · `page`   — the whole screen has nothing on it. Gets the dashed panel, the
 *               room to breathe, and usually an `action`, because the user
 *               arrived expecting something and needs a way forward.
 *  · `inline` — one card in a page of cards is empty. No border (the card
 *               already has one) and much less height, because stacking a
 *               second bordered box inside a bordered box is noise.
 */
export function EmptyState({
  icon: Icon = FileText,
  label,
  description,
  action,
  size = 'page',
  className,
}: {
  icon?: LucideIcon
  /** The one sentence. Required — an empty state with no explanation is a bug. */
  label: string
  description?: string
  action?: React.ReactNode
  size?: 'page' | 'inline'
  className?: string
}) {
  const page = size === 'page'
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 text-center',
        page
          ? 'border-border/70 bg-card/40 rounded-xl border border-dashed px-6 py-12'
          : 'px-4 py-8',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'bg-muted text-muted-foreground grid place-items-center rounded-full',
          page ? 'size-11' : 'size-9',
        )}
      >
        <Icon className={page ? 'size-5' : 'size-4'} />
      </span>
      <div className="space-y-1">
        <p className={cn('text-muted-foreground max-w-sm', page ? 'text-sm' : 'text-xs')}>
          {label}
        </p>
        {description && <p className="text-muted-foreground/80 max-w-sm text-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}
