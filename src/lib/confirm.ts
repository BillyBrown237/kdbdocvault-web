/**
 * Friction in front of an irreversible action (W34).
 *
 * An audit of the app found eighteen destructive mutations firing straight from
 * `onClick` with nothing in between — only SSO deletion asked first. Not all
 * eighteen deserve a prompt: deleting your own comment or a reminder is cheap
 * to redo, and a confirmation on every click trains people to dismiss them
 * without reading, which is worse than having none.
 *
 * The line drawn here is whether the consequence lands on SOMEONE ELSE, or
 * cannot be undone from the UI:
 *
 *   confirmed   revoking an API key or webhook (a live integration stops),
 *               revoking a share link (a link someone already holds dies),
 *               deleting a retention policy (a compliance control), removing a
 *               member (access to every document, immediately)
 *   not         comments, reminders, saved searches, your own sessions —
 *               yours, cheap, and reversible by redoing them
 *
 * `window.confirm` rather than a styled dialog: it is what the codebase already
 * used, it cannot be missed, and it works before any of this renders. Replacing
 * it with a proper AlertDialog is a fine follow-up — having the friction at all
 * is the part that matters.
 */
export function confirmDestructive(message: string): boolean {
  return window.confirm(message)
}
