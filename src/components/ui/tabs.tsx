import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

/**
 * Underline tabs, not pills (W34).
 *
 * The pill-in-a-grey-trough style is a segmented control: it works for two or
 * three equal choices and falls apart at Settings' six, which had to wrap onto
 * a second line. Underlines scale to any number, scroll sideways on a phone
 * instead of wrapping, and read as "sections of this page" rather than "pick
 * one of these modes" — which is what these actually are.
 */
const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // The border sits on the LIST, so the active underline lands exactly on
      // it rather than floating a pixel above or below.
      'text-muted-foreground relative flex h-10 items-stretch gap-1 overflow-x-auto border-b',
      // A scrollbar under a row of tabs is visual noise; the overflow still
      // scrolls by touch, wheel and keyboard.
      '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-t-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
      'hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
      'disabled:pointer-events-none disabled:opacity-50',
      // -bottom-px pulls the marker over the list's own border instead of
      // stacking a second line beneath it.
      'data-[state=active]:text-foreground data-[state=active]:after:bg-primary data-[state=active]:after:absolute data-[state=active]:after:inset-x-1 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    // mt-5, and the callers no longer restate it: fourteen of them had pasted
    // the same mt-4 back in, which is how a component quietly stops being the
    // thing that decides its own spacing.
    className={cn('mt-5 focus-visible:outline-none', className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
