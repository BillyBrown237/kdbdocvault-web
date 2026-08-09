import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

import { ApiProblem } from '@/lib/api/http'
import { cn } from '@/lib/utils'

/**
 * Form-level callout (W22) — the problem+json renderer. Calm by design:
 * no shaking, no red walls. When given an ApiProblem it shows the human
 * message plus the machine facts (code, trace) in monospace fine print —
 * exactly what a user reads to support over the phone.
 */
const VARIANTS = {
  error: { icon: AlertTriangle, className: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: Info, className: 'border-sky-200 bg-sky-50 text-sky-900' },
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
}

export function Callout({
  variant = 'error',
  problem,
  children,
  className,
}: {
  variant?: keyof typeof VARIANTS
  /** When set, message and fine print derive from the problem. */
  problem?: unknown
  children?: React.ReactNode
  className?: string
}) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant]
  const p = problem instanceof ApiProblem ? problem : undefined
  const rawField = (k: string): string | undefined =>
    p?.raw && typeof p.raw === 'object' && k in (p.raw as object)
      ? String((p.raw as Record<string, unknown>)[k])
      : undefined
  const code = rawField('code')
  const trace = rawField('trace_id')

  return (
    <div role="alert" className={cn('rounded-md border px-3.5 py-3 text-sm', variantClass, className)}>
      <div className="flex gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div>{children ?? p?.detail ?? p?.title}</div>
          {p && (
            <div className="mt-1.5 font-mono text-[11px] opacity-70">
              {[code ?? String(p.status), trace ? `trace ${trace}` : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
