import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { AppShell } from '@/components/app-shell'
import { DocumentRow, EmptyState } from '@/components/vault-list'
import { favoritesQuery, recentQuery, tenantUsageQuery } from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatBytes } from '@/lib/format'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: Dashboard,
})

function Dashboard() {
  const { t, i18n } = useTranslation()
  const recent = useQuery(recentQuery)
  const favorites = useQuery(favoritesQuery)
  const usage = useQuery(tenantUsageQuery)

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      {usage.data && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
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
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('dashboard.recent')}
        </h2>
        {recent.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : recent.data?.data.length ? (
          <div className="space-y-2">
            {recent.data.data.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <EmptyState label={t('dashboard.noRecent')} />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('dashboard.favorites')}
        </h2>
        {favorites.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : favorites.data?.data.length ? (
          <div className="space-y-2">
            {favorites.data.data.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <EmptyState label={t('dashboard.noFavorites')} />
        )}
      </section>
    </AppShell>
  )
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  )
}
