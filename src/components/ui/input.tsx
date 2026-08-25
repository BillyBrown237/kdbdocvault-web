import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The shared look of every form control (W34).
 *
 * Exported so a hand-rolled `<select>` — of which there is at least one — can
 * be made to match instead of approximating it. Notes on the choices:
 *
 *  · `bg-background`, not `bg-transparent`. A transparent field inherits its
 *    parent's colour but keeps the light theme's near-black text, which is how
 *    the auth screen once ended up with fields you could type into and not
 *    see. An opaque field cannot be broken by the surface behind it.
 *  · A ring AND a border shift on focus: on a white card the ring alone is
 *    easy to miss, which matters most for people tabbing through a long form.
 *  · `aria-invalid` paints. Several forms already set it and nothing rendered,
 *    so the field was announced as wrong to a screen reader and looked
 *    perfectly fine to everyone else.
 */
export const fieldClass = cn(
  'border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-[color,box-shadow,border-color]',
  'placeholder:text-muted-foreground hover:border-ring/50',
  'focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none',
  'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        fieldClass,
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
