/**
 * The shared look of a titled panel header (W34).
 *
 * Eleven detail-screen components had each pasted the same className to build
 * this — `flex items-center gap-2 text-sm text-muted-foreground` with an
 * `h-4 w-4` icon. They happened to agree, which is luck rather than design:
 * the twelfth would not have, and none of them could be improved without
 * editing all eleven.
 *
 * Exported as classes rather than as a <Panel> component on purpose. Wrapping
 * the markup would mean restructuring eleven files' JSX, and swapping a string
 * cannot change what the tree renders — only what it looks like. The component
 * version is a fine follow-up; it is not something to attempt without being
 * able to run the build.
 *
 * The change this makes possible, applied to all eleven at once: the title is
 * foreground-weight with only the ICON muted, instead of the whole line being
 * muted. A panel heading labels the content under it — it is not an aside, and
 * muting the entire line made the document detail screen read as twelve
 * pieces of fine print stacked on top of each other.
 */
export const panelTitleClass = 'flex items-center gap-2 text-sm font-semibold'

/** The icon inside a panel title. Muted, so the words carry the weight. */
export const panelIconClass = 'text-muted-foreground h-4 w-4 shrink-0'
