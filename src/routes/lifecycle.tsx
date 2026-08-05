import { createFileRoute, Link } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarClock, FileText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import { expiringQuery, obligationsQuery, updateObligation } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatDate } from '@/lib/format'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/lifecycle')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: LifecyclePage,
})

function LifecyclePage() {
  const { t } = useTranslation()
  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('lifecycle.title')}</h1>
      </div>
      <Tabs defaultValue="expiring" className="mt-4">
        <TabsList>
          <TabsTrigger value="expiring">{t('lifecycle.expiring')}</TabsTrigger>
          <TabsTrigger value="obligations">{t('lifecycle.obligations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="expiring">
          <ExpiringTab />
        </TabsContent>
        <TabsContent value="obligations">
          <ObligationsTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

const RULE_VARIANT: Record<string, BadgeProps['variant']> = {
  expiry: 'destructive',
  renewal: 'warning',
  review: 'secondary',
}

function ExpiringTab() {
  const { t, i18n } = useTranslation()
  const q = useInfiniteQuery(expiringQuery(90))
  const rules = q.data?.pages.flatMap((p) => p.data) ?? []

  if (q.isPending)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    )
  if (rules.length === 0) return <EmptyState label={t('lifecycle.noExpiring')} />

  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <Link key={r.id} to="/documents/$documentId" params={{ documentId: r.document_id }}>
          <Card className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {r.document_title ?? r.document_id}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('lifecycle.keyDate', { date: formatDate(r.key_date, i18n.language) })}
              </div>
            </div>
            <Badge variant={RULE_VARIANT[r.rule_type] ?? 'secondary'}>
              {t(`lifecycle.ruleType.${r.rule_type}`)}
            </Badge>
          </Card>
        </Link>
      ))}
      <LoadMoreButton
        hasMore={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onClick={() => void q.fetchNextPage()}
      />
    </div>
  )
}

const OBLIGATION_VARIANT: Record<string, BadgeProps['variant']> = {
  open: 'secondary',
  done: 'success',
  overdue: 'destructive',
}

function ObligationsTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const q = useInfiniteQuery(obligationsQuery())
  const items = q.data?.pages.flatMap((p) => p.data) ?? []

  const complete = useMutation({
    mutationFn: (id: string) => updateObligation(id, { status: 'done' }),
    onSuccess: async () => {
      toast.success(t('lifecycle.obligationDone'))
      await queryClient.invalidateQueries({ queryKey: ['obligations'] })
    },
  })

  if (q.isPending)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    )
  if (items.length === 0) return <EmptyState label={t('lifecycle.noObligations')} />

  return (
    <div className="space-y-2">
      {items.map((o) => (
        <Card key={o.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{o.title}</div>
            <div className="text-xs text-muted-foreground">
              {o.document_title ? `${o.document_title} · ` : ''}
              {t('lifecycle.due', { date: formatDate(o.due_date, i18n.language) })}
            </div>
          </div>
          <Badge variant={OBLIGATION_VARIANT[o.status] ?? 'secondary'}>
            {t(`lifecycle.obligationStatus.${o.status}`)}
          </Badge>
          {o.status !== 'done' && (
            <Button
              size="sm"
              variant="outline"
              disabled={complete.isPending}
              onClick={() => complete.mutate(o.id)}
            >
              {t('lifecycle.markDone')}
            </Button>
          )}
        </Card>
      ))}
      <LoadMoreButton
        hasMore={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onClick={() => void q.fetchNextPage()}
      />
    </div>
  )
}
