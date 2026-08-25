import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileText, Folder as FolderIcon } from 'lucide-react'

import { formatBytes, formatDate } from '@/lib/format'
import { FolderActions } from '@/components/folder-actions'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Document, Folder } from '@/lib/api/types'

/**
 * Shared row chrome (W34).
 *
 * The two rows had drifted apart by a class or two, which is invisible in a
 * list of folders and obvious in a mixed list where they sit next to each
 * other. One constant, one appearance.
 *
 * `group` is what lets the icon tile pick up the hover — the tint has to come
 * from the row, not from hovering the 20px glyph itself.
 */
const ROW =
  'group flex items-center gap-3 px-3 py-2.5 transition-[background-color,border-color,box-shadow] hover:border-ring/40 hover:bg-muted/40 hover:shadow-pop'

/** The icon tile. A bare glyph on a white row has no weight; a tinted square
 *  gives each row a fixed left anchor for the eye to run down. */
const TILE = 'grid size-9 shrink-0 place-items-center rounded-lg transition-colors'

export function FolderRow({ folder }: { folder: Folder }) {
  return (
    <Link to="/vault/$folderId" params={{ folderId: folder.id }} className="block">
      <Card className={ROW}>
        <span className={`${TILE} bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/15`}>
          <FolderIcon className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{folder.name}</span>
        {/* W24: rename/move/delete — inside the Link, so the trigger
            preventDefaults navigation. */}
        <FolderActions folder={folder} />
      </Card>
    </Link>
  )
}

export function DocumentRow({ document }: { document: Document }) {
  const { i18n } = useTranslation()
  const version = document.current_version

  return (
    <Link to="/documents/$documentId" params={{ documentId: document.id }} className="block">
      <Card className={ROW}>
        <span className={`${TILE} bg-primary/8 text-primary group-hover:bg-primary/12`}>
          <FileText className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{document.title}</div>
          <div className="text-muted-foreground truncate text-xs">
            {version ? `${formatBytes(version.size_bytes, i18n.language)} · ` : ''}
            {formatDate(document.updated_at, i18n.language)}
          </div>
        </div>
        <StatusBadge domain="document" status={document.status} />
      </Card>
    </Link>
  )
}

/**
 * Placeholder rows, shaped like the rows that are coming.
 *
 * The vault previously showed a grey "Loading…" sentence where a list was
 * about to appear, so the page visibly jumped from one line of text to a full
 * list. Skeletons in the row's own shape mean the layout is already correct
 * before the data lands and nothing moves when it does.
 */
export function RowSkeleton({ count = 5 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    // The live region carries the loading message the skeletons no longer say
    // out loud — Skeleton itself is aria-hidden.
    <div className="space-y-2" role="status" aria-live="polite" aria-busy>
      <span className="sr-only">{t('app.loading')}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-panel"
        >
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Uneven widths: a stack of identical bars looks like a table
                rule, not like titles of different lengths. */}
            <Skeleton className="h-3.5" style={{ width: `${55 - (i % 3) * 12}%` }} />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Re-exported so the many routes that already import EmptyState from here keep
// working; the component itself now lives in ui/ because it is not a
// vault-specific idea.
export { EmptyState } from '@/components/ui/empty-state'

export function LoadMoreButton({
  hasMore,
  loading,
  onClick,
}: {
  hasMore: boolean
  loading: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  if (!hasMore) return null
  return (
    <Button variant="outline" onClick={onClick} disabled={loading} className="mx-auto mt-4 flex">
      {loading ? t('app.loading') : t('common.loadMore')}
    </Button>
  )
}
