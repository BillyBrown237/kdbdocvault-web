import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileText, Folder as FolderIcon } from 'lucide-react'

import { formatBytes, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'
import type { Document, Folder } from '@/lib/api/types'


export function FolderRow({ folder }: { folder: Folder }) {
  return (
    <Link to="/vault/$folderId" params={{ folderId: folder.id }}>
      <Card className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
        <FolderIcon className="h-5 w-5 shrink-0 text-amber-500" />
        <span className="truncate text-sm font-medium">{folder.name}</span>
      </Card>
    </Link>
  )
}

export function DocumentRow({ document }: { document: Document }) {
  const { t, i18n } = useTranslation()
  const version = document.current_version

  return (
    <Link to="/documents/$documentId" params={{ documentId: document.id }}>
      <Card className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{document.title}</div>
          <div className="text-xs text-muted-foreground">
            {version ? `${formatBytes(version.size_bytes, i18n.language)} · ` : ''}
            {formatDate(document.updated_at, i18n.language)}
          </div>
        </div>
        <StatusBadge domain="document" status={document.status} />
      </Card>
    </Link>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
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
    <Button variant="outline" onClick={onClick} disabled={loading} className="mx-auto mt-4 flex">
      {loading ? t('app.loading') : t('common.loadMore')}
    </Button>
  )
}
