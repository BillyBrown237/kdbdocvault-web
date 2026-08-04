import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileText, Folder as FolderIcon } from 'lucide-react'

import { formatBytes, formatDate } from '@/lib/format'
import type { Document, Folder } from '@/lib/api/types'

const STATUS_STYLES: Record<Document['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-800',
  expiring: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
  renewed: 'bg-blue-100 text-blue-800',
  archived: 'bg-slate-100 text-slate-500',
}

export function FolderRow({ folder }: { folder: Folder }) {
  return (
    <Link
      to="/vault/$folderId"
      params={{ folderId: folder.id }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted"
    >
      <FolderIcon className="h-5 w-5 shrink-0 text-amber-500" />
      <span className="truncate text-sm font-medium">{folder.name}</span>
    </Link>
  )
}

export function DocumentRow({ document }: { document: Document }) {
  const { t, i18n } = useTranslation()
  const version = document.current_version

  return (
    <Link
      to="/documents/$documentId"
      params={{ documentId: document.id }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted"
    >
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{document.title}</div>
        <div className="text-xs text-muted-foreground">
          {version ? `${formatBytes(version.size_bytes, i18n.language)} · ` : ''}
          {formatDate(document.updated_at, i18n.language)}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[document.status]}`}
      >
        {t(`document.status.${document.status}`)}
      </span>
    </Link>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

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
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="mx-auto mt-4 block rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
    >
      {loading ? t('app.loading') : t('common.loadMore')}
    </button>
  )
}
