import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useInView } from '@/lib/useInView'

/**
 * Fades its child up the first time it scrolls into view.
 *
 * `index` staggers siblings — pass the array index and a row of cards arrives
 * in sequence rather than all at once.
 *
 * The hidden state is `motion-safe:opacity-0`, not `opacity-0`: someone who
 * asked for reduced motion sees the content immediately, with no observer and
 * no fade. The animation's `both` fill mode then holds the final opacity, so
 * the two classes coexist without a flicker at the end.
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode
  index?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn('motion-safe:opacity-0', inView && 'motion-safe:animate-rise', className)}
      style={{ '--i': index } as CSSProperties}
    >
      {children}
    </div>
  )
}
