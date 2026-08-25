import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Kept deliberately identical to Input — see input.tsx for why each
          // of these is here. A textarea that focuses differently from the
          // field above it is the kind of detail that reads as unfinished.
          'border-input bg-background flex min-h-16 w-full rounded-md border px-3 py-2 text-sm transition-[color,box-shadow,border-color]',
          'placeholder:text-muted-foreground hover:border-ring/50',
          'focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none',
          'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)

export { Textarea }
