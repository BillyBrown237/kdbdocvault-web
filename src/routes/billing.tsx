import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Download, FileText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { MobileMoneyDialog } from '@/components/mobile-money-dialog'
import { EmptyState, LoadMoreButton } from '@/components/vault-list'
import {
  invoicePdfUrl,
  invoicesQuery,
  plansQuery,
  subscriptionQuery,
  tenantUsageQuery,
} from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatBytes, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/billing')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: BillingPage,
})


function BillingPage() {
  const { t, i18n } = useTranslation()
  const sub = useQuery(subscriptionQuery)
  const plans = useQuery(plansQuery)
  const usage = useQuery(tenantUsageQuery)
  const invoices = useInfiniteQuery(invoicesQuery)

  const [payPlanId, setPayPlanId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function choosePlan(planId: string) {
    setPayPlanId(planId)
    setDialogOpen(true)
  }

  const price = (minor: number, currency: string, interval: string) =>
    `${new Intl.NumberFormat(i18n.language).format(minor)} ${currency} / ${t(`onboarding.interval.${interval}`)}`

  const currentPlanId = sub.data?.plan_id
  const invoiceItems = invoices.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{t('billing.title')}</h1>
      </div>

      {/* Current subscription */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">{t('billing.current')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sub.isPending ? (
            <Skeleton className="h-10" />
          ) : !sub.data?.plan_id ? (
            <p className="text-sm text-muted-foreground">{t('billing.trialNote')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">
                {plans.data?.data.find((p) => p.id === sub.data!.plan_id)?.name ?? sub.data.plan_id}
              </span>
              <StatusBadge domain="subscription" status={sub.data.status} />
              {sub.data.renews_at && (
                <span className="text-sm text-muted-foreground">
                  {t('billing.renews', { date: formatDate(sub.data.renews_at, i18n.language) })}
                </span>
              )}
            </div>
          )}
          {usage.data && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t('usage.storage')}: {formatBytes(usage.data.storage_bytes_used, i18n.language)} /{' '}
              {formatBytes(usage.data.storage_bytes_included, i18n.language)} · {t('usage.seats')}:{' '}
              {usage.data.seats_used}/{usage.data.seats_included}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">{t('billing.plans')}</h2>
      {plans.isPending ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {plans.data?.data.map((p) => {
            const current = p.id === currentPlanId
            return (
              <Card key={p.id} className={cn(current && 'border-primary ring-1 ring-primary')}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {p.name}
                    {current && <Badge variant="secondary">{t('billing.currentBadge')}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg font-bold">
                    {price(p.price_minor_units, p.currency, p.billing_interval)}
                  </div>
                  {p.features && (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {p.features.map((f, i) => (
                        <li key={i}>· {f}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    variant={current ? 'outline' : 'default'}
                    disabled={current}
                    onClick={() => choosePlan(p.id)}
                  >
                    {current ? t('billing.currentBadge') : t('billing.choose')}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Invoices */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">{t('billing.invoices')}</h2>
      {invoices.isPending ? (
        <Skeleton className="h-24" />
      ) : invoiceItems.length === 0 ? (
        <EmptyState label={t('billing.noInvoices')} />
      ) : (
        <div className="space-y-2">
          {invoiceItems.map((inv) => (
            <Card key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{inv.number}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(inv.issued_at, i18n.language)} ·{' '}
                  {new Intl.NumberFormat(i18n.language).format(inv.amount_minor_units)} {inv.currency}
                </div>
              </div>
              <StatusBadge domain="invoice" status={inv.status} />
              <Button variant="outline" size="sm" asChild>
                <a href={invoicePdfUrl(inv.id)} target="_blank" rel="noreferrer">
                  <Download className="h-3 w-3" />
                  PDF
                </a>
              </Button>
            </Card>
          ))}
          <LoadMoreButton
            hasMore={Boolean(invoices.hasNextPage)}
            loading={invoices.isFetchingNextPage}
            onClick={() => void invoices.fetchNextPage()}
          />
        </div>
      )}

      <MobileMoneyDialog planId={payPlanId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  )
}
