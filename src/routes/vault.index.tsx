import { createFileRoute } from '@tanstack/react-router'
import { FolderClosed } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/ui/page-header'
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
import { documentsQuery, rootFoldersQuery } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'

export const Route = createFileRoute('/vault/')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: VaultRoot,
})

function VaultRoot() {
  const { t } = useTranslation()
  const folders = useInfiniteQuery(rootFoldersQuery)
  const documents = useInfiniteQuery(documentsQuery())

  const folderItems = folders.data?.pages.flatMap((p) => p.data) ?? []
  const documentItems = documents.data?.pages.flatMap((p) => p.data) ?? []
  const isPending = folders.isPending || documents.isPending
  const isEmpty = !isPending && folderItems.length === 0 && documentItems.length === 0

  return (
    <AppShell>
      <PageHeader
        icon={FolderClosed}
        title={t('vault.title')}
        actions={
          <>
            {/* No wrapper div: PageHeader's actions slot is already a flex row
                with the same gap. */}
            <NewFolderButton />
            <UploadButton />
          </>
        }
      />

      {isPending && (
        <div className="mt-4">
          <RowSkeleton />
        </div>
      )}
      {isEmpty && (
        <div className="mt-4">
          <EmptyState icon={FolderClosed} label={t('vault.empty')} />
        </div>
      )}

      {folderItems.length > 0 && (
        <section className="mt-4 space-y-2">
          {folderItems.map((folder) => (
            <FolderRow key={folder.id} folder={folder} />
          ))}
          <LoadMoreButton
            hasMore={Boolean(folders.hasNextPage)}
            loading={folders.isFetchingNextPage}
            onClick={() => void folders.fetchNextPage()}
          />
        </section>
      )}

      {documentItems.length > 0 && (
        <section className="mt-4 space-y-2">
          {documentItems.map((doc) => (
            <DocumentRow key={doc.id} document={doc} />
          ))}
          <LoadMoreButton
            hasMore={Boolean(documents.hasNextPage)}
            loading={documents.isFetchingNextPage}
            onClick={() => void documents.fetchNextPage()}
          />
        </section>
      )}
    </AppShell>
  )
}
