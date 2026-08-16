import { cn } from '@/lib/utils'

/**
 * W27 — the component library's missing binary control.
 *
 * A native `<button role="switch">` rather than a checkbox: switches take
 * effect on toggle (no separate submit implied), and `aria-checked` on a
 * switch role is what screen readers announce as on/off. Keyboard and focus
 * behaviour come free from the button element instead of being reimplemented
 * on a styled div.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        'disabled:opacity-50 motion-safe:transition-colors',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow ring-0',
          'motion-safe:transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
