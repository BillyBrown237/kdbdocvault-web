/**
 * Class joiner.
 *
 * Deliberately not `clsx` + `tailwind-merge`: this site has a small, curated
 * set of components whose variants never fight each other, so the conflict
 * resolution those libraries provide would be two dependencies solving a
 * problem we don't have. If a component ever needs to override a caller's
 * padding, revisit — until then, filtering falsy values is the whole job.
 */
export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
