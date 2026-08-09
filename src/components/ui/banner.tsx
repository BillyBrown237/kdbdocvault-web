import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CloudOff, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The app's standing banners, unified (W22). Three variants only:
 *  - offline  — a FACT, not a warning (slate, CloudOff): "waiting", never
 *    "failed".
 *  - readonly — the subscription gate (amber): writes disabled, one link
 *    out (billing).
 *  - notice   — degraded/informational (azure).
 * Render order when stacked: offline above readonly above notice.
 */
const VARIANTS = {
  offline: {
    icon: CloudOff,
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  readonly: {
    icon: AlertTriangle,
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  notice: {
    icon: Info,
    className: 'border-sky-300 bg-sky-50 text-sky-900',
  },
} satisfies Record<string, { icon: LucideIcon; className: string }>

export function Banner({
  variant,
  children,
  action,
  className,
}: {
  variant: keyof typeof VARIANTS
  children: React.ReactNode
  /** Optional right-aligned action (link/button). */
  action?: React.ReactNode
  className?: string
}) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant]
  return (
    <div
      role={variant === 'offline' ? 'status' : 'alert'}
      className={cn('flex items-center gap-2 border-b px-4 py-2 text-sm', variantClass, className)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action}
    </div>
  )
}
