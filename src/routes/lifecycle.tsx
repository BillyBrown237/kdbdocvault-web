import { createFileRoute, Link } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CalendarClock, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
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
      <PageHeader icon={CalendarClock} title={t('lifecycle.title')} />
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
  if (rules.length === 0)
    return <EmptyState icon={CalendarClock} label={t('lifecycle.noExpiring')} />

  return (
    <div className="space-y-2">
      {rules.map((r) => {
        // This screen exists to answer "what is about to lapse?", so the date
        // is the point of the row and gets weight when it is close or past.
        // No new copy: the colour and the icon carry it, and the date itself
        // is already there to read. Amber inside a week, red once past.
        const days = Math.ceil((new Date(r.key_date).getTime() - Date.now()) / 86_400_000)
        const urgency =
          days < 0 ? 'text-destructive font-medium' : days <= 7 ? 'text-amber-600 font-medium' : ''
        return (
          <Link
            key={r.id}
            to="/documents/$documentId"
            params={{ documentId: r.document_id }}
            className="block"
          >
            <Card className="group hover:border-ring/40 hover:bg-muted/40 hover:shadow-pop flex items-center gap-3 px-3 py-2.5 transition-[background-color,border-color,box-shadow]">
              <span className="bg-primary/8 text-primary grid size-9 shrink-0 place-items-center rounded-lg transition-colors group-hover:bg-primary/12">
                <FileText className="h-[1.05rem] w-[1.05rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {r.document_title ?? r.document_id}
                </div>
                <div
                  className={cn('flex items-center gap-1 text-xs text-muted-foreground', urgency)}
                >
                  {days <= 7 && <AlertTriangle className="size-3 shrink-0" aria-hidden />}
                  {t('lifecycle.keyDate', { date: formatDate(r.key_date, i18n.language) })}
                </div>
              </div>
              <Badge variant={RULE_VARIANT[r.rule_type] ?? 'secondary'}>
                {t(`lifecycle.ruleType.${r.rule_type}`)}
              </Badge>
            </Card>
          </Link>
        )
      })}
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
  if (items.length === 0)
    return <EmptyState icon={CalendarClock} label={t('lifecycle.noObligations')} />

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
