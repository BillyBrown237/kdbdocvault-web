import { Link, createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { UploadButton } from '@/components/upload-button'
import {
  DocumentRow,
  EmptyState,
  FolderRow,
  LoadMoreButton,
} from '@/components/vault-list'
import { folderContentsQuery, folderQuery } from '@/lib/api/queries'
import { isDocument } from '@/lib/api/types'
import { requireTenant } from '@/lib/route-guards'

export const Route = createFileRoute('/vault/$folderId')({
  beforeLoad: ({ location }) => requireTenant(location),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(folderQuery(params.folderId)),
  component: FolderView,
})

function FolderView() {
  const { t } = useTranslation()
  const { folderId } = Route.useParams()
  const folder = useQuery(folderQuery(folderId))
  const contents = useInfiniteQuery(folderContentsQuery(folderId))

  const items = contents.data?.pages.flatMap((p) => p.data) ?? []
  const parentId = folder.data?.parent_id

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        {parentId ? (
          <Link
            to="/vault/$folderId"
            params={{ folderId: parentId }}
            className="rounded-md p-1 hover:bg-muted"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <Link
            to="/vault"
            className="rounded-md p-1 hover:bg-muted"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold">
          {folder.data?.name ?? t('app.loading')}
        </h1>
        <UploadButton folderId={folderId} />
      </div>
      {folder.data?.path && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{folder.data.path}</p>
      )}

      {contents.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('app.loading')}</p>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState label={t('vault.emptyFolder')} />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) =>
            isDocument(item) ? (
              <DocumentRow key={item.id} document={item} />
            ) : (
              <FolderRow key={item.id} folder={item} />
            ),
          )}
          <LoadMoreButton
            hasMore={Boolean(contents.hasNextPage)}
            loading={contents.isFetchingNextPage}
            onClick={() => void contents.fetchNextPage()}
          />
        </div>
      )}
    </AppShell>
  )
}
