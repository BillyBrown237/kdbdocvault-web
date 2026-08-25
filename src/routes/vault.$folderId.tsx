import { Link, createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, FolderClosed } from 'lucide-react'

import { PageHeader, backControlClass } from '@/components/ui/page-header'
import { AppShell } from '@/components/app-shell'
import { NewFolderButton } from '@/components/new-folder-button'
import { UploadButton } from '@/components/upload-button'
import {
  DocumentRow,
  EmptyState,
  FolderRow,
  LoadMoreButton,
  RowSkeleton,
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
      <PageHeader
        // A Link, not history.back(): "up one folder" is a place, so it should
        // be middle-clickable and copyable like any other navigation.
        back={
          parentId ? (
            <Link
              to="/vault/$folderId"
              params={{ folderId: parentId }}
              className={backControlClass}
              aria-label={t('common.back')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/vault" className={backControlClass} aria-label={t('common.back')}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )
        }
        title={folder.data?.name ?? t('app.loading')}
        description={folder.data?.path}
        actions={
          <>
            <NewFolderButton parentId={folderId} />
            <UploadButton folderId={folderId} />
          </>
        }
      />

      {contents.isPending ? (
        <div className="mt-4">
          <RowSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={FolderClosed} label={t('vault.emptyFolder')} />
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
