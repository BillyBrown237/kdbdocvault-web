import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Password field (W23): show/hide, CapsLock hint, optional live strength
 * meter. The meter never red-shames — its weakest tone is amber, and the
 * label says what to do, not how bad it is.
 */

function entropyBits(pw: string): number {
  if (!pw) return 0
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26
  if (/[A-Z]/.test(pw)) pool += 26
  if (/\d/.test(pw)) pool += 10
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33
  return pw.length * Math.log2(pool || 1)
}

const LEVELS = [
  { min: 0, key: 'weak', bar: 'bg-amber-400', width: 'w-1/4' },
  { min: 35, key: 'fair', bar: 'bg-sky-400', width: 'w-2/4' },
  { min: 55, key: 'good', bar: 'bg-teal-500', width: 'w-3/4' },
  { min: 75, key: 'strong', bar: 'bg-emerald-500', width: 'w-full' },
]

export function StrengthMeter({ value }: { value: string }) {
  const { t } = useTranslation()
  if (!value) return null
  const bits = entropyBits(value)
  const level = [...LEVELS].reverse().find((l) => bits >= l.min) ?? LEVELS[0]
  return (
    <div aria-live="polite">
      <div className="h-1 overflow-hidden rounded-full bg-slate-200">
        <div className={cn('h-full rounded-full transition-all', level.bar, level.width)} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t(`auth.strength.${level.key}`)}</p>
    </div>
  )
}

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PasswordInput({ className, onBlur, onKeyDown, onKeyUp, ...props }, ref) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)

  return (
    <div>
      <div className="relative">
        <Input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn('pr-10', className)}
          onKeyDown={(e) => {
            setCaps(e.getModifierState('CapsLock'))
            onKeyDown?.(e)
          }}
          onKeyUp={(e) => {
            setCaps(e.getModifierState('CapsLock'))
            onKeyUp?.(e)
          }}
          onBlur={(e) => {
            setCaps(false)
            onBlur?.(e)
          }}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
          onClick={() => setShow((s) => !s)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {caps && <p className="mt-1 text-xs text-amber-700">{t('auth.capsLock')}</p>}
    </div>
  )
})
