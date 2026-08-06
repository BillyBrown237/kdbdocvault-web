import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { AppShell } from '@/components/app-shell'
import { DocumentRow, EmptyState } from '@/components/vault-list'
import { favoritesQuery, pinsQuery, recentQuery, tenantUsageQuery } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatBytes } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: Dashboard,
})

function Dashboard() {
  const { t, i18n } = useTranslation()
  const recent = useQuery(recentQuery)
  const favorites = useQuery(favoritesQuery)
  const pins = useQuery(pinsQuery)
  const usage = useQuery(tenantUsageQuery)

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {usage.isPending
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : usage.data && (
              <>
                <UsageCard
                  label={t('usage.storage')}
                  value={`${formatBytes(usage.data.storage_bytes_used, i18n.language)} / ${formatBytes(usage.data.storage_bytes_included, i18n.language)}`}
                />
                <UsageCard
                  label={t('usage.seats')}
                  value={`${usage.data.seats_used} / ${usage.data.seats_included}`}
                />
                <UsageCard label={t('usage.aiCredits')} value={String(usage.data.ai_credits_used)} />
                <UsageCard
                  label={t('usage.envelopes')}
                  value={String(usage.data.signature_envelopes_used)}
                />
              </>
            )}
      </div>

      {/* Pinned first: it's the only list the user curates by hand, so it
          earns the top slot over "recent", which curates itself. */}
      {(pins.data?.data.length ?? 0) > 0 && (
        <Section title={t('pins.title')}>
          <div className="space-y-2">
            {pins.data!.data.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        </Section>
      )}

      <Section title={t('dashboard.recent')}>
        {recent.isPending ? (
          <ListSkeleton />
        ) : recent.data?.data.length ? (
          <div className="space-y-2">
            {recent.data.data.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <EmptyState label={t('dashboard.noRecent')} />
        )}
      </Section>

      <Section title={t('dashboard.favorites')}>
        {favorites.isPending ? (
          <ListSkeleton />
        ) : favorites.data?.data.length ? (
          <div className="space-y-2">
            {favorites.data.data.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <EmptyState label={t('dashboard.noFavorites')} />
        )}
      </Section>
    </AppShell>
  )
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-1">
        <CardTitle className="text-xs font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="truncate text-sm font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  )
}
