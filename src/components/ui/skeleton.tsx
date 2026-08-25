import { cn } from '@/lib/utils'

/**
 * A shimmer, not a pulse (W34).
 *
 * A block fading in and out looks like something failing to render. A sweep
 * moves in one direction, which reads as progress — and `motion-reduce` drops
 * back to a plain block rather than a pulse, because for someone who asked for
 * less motion, less motion is the point.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // aria-hidden: a screen reader should hear the loading message the page
      // already provides, not a count of decorative grey rectangles.
      aria-hidden
      className={cn('bg-muted animate-shimmer overflow-hidden rounded-md', className)}
      {...props}
    />
  )
}

/**
 * Placeholder lines for a list that is loading (W34).
 *
 * Eleven screens each rendered one tall `<Skeleton className="h-40" />` where a
 * list of rows was about to appear, so every one of them visibly jumped when
 * the data landed. Two shapes cover almost all of them: this, and
 * {@link TableSkeleton}.
 *
 * Widths vary per row on purpose — a stack of identical bars reads as a table
 * rule, not as titles of different lengths.
 */
function ListSkeleton({
  rows = 4,
  /** A second, shorter line under each title — for rows that carry metadata. */
  meta = true,
  className,
}: {
  rows?: number
  meta?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-live="polite" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5" style={{ width: `${62 - (i % 3) * 14}%` }} />
          {meta && <Skeleton className="h-2.5 w-32" />}
        </div>
      ))}
    </div>
  )
}

/** Placeholder rows for a `<Table>`, including its header line. */
function TableSkeleton({
  rows = 6,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite" aria-busy>
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton, ListSkeleton, TableSkeleton }
