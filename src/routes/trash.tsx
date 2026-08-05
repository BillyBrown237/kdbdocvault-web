import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Trash2, Undo2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { restoreDocument, trashQuery } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/trash')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: TrashPage,
})

function TrashPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const trash = useInfiniteQuery(trashQuery)

  const restore = useMutation({
    mutationFn: restoreDocument,
    onSuccess: async () => {
      toast.success(t('trash.restored'))
      await queryClient.invalidateQueries({ queryKey: ['trash'] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const items = trash.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('trash.title')}</h1>
      </div>

      {trash.isPending ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState label={t('trash.empty')} />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">
                  {item.purge_after
                    ? t('trash.purgeAfter', { date: formatDate(item.purge_after, i18n.language) })
                    : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={restore.isPending}
                onClick={() => restore.mutate(item.id)}
              >
                <Undo2 className="h-3 w-3" />
                {t('trash.restore')}
              </Button>
            </Card>
          ))}
          <LoadMoreButton
            hasMore={Boolean(trash.hasNextPage)}
            loading={trash.isFetchingNextPage}
            onClick={() => void trash.fetchNextPage()}
          />
        </div>
      )}
    </AppShell>
  )
}
