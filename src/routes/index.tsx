import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  ClipboardCheck,
  Clock,
  HardDrive,
  PenLine,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'

import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { AppShell } from '@/components/app-shell'
import { DocumentRow, EmptyState } from '@/components/vault-list'
import {
  favoritesQuery,
  meQuery,
  pinsQuery,
  recentQuery,
  tenantUsageQuery,
} from '@/lib/api/queries'
import { requireTenant } from '@/lib/route-guards'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: Dashboard,
})

function Dashboard() {
  const { t, i18n } = useTranslation()
  const me = useQuery(meQuery)
  const recent = useQuery(recentQuery)
  const favorites = useQuery(favoritesQuery)
  const pins = useQuery(pinsQuery)
  const usage = useQuery(tenantUsageQuery)

  // First name only — "Bonjour, Billy" is a greeting; the full legal name is a
  // record. Falls back to a name-free greeting rather than showing an email.
  const firstName = me.data?.name?.trim().split(/\s+/)[0]
  const u = usage.data

  return (
    <AppShell>
      <PageHeader
        title={firstName ? t('dashboard.welcome', { name: firstName }) : t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <>
            <QuickLink to="/lifecycle" icon={CalendarClock} label={t('nav.lifecycle')} />
            <QuickLink to="/approvals" icon={ClipboardCheck} label={t('nav.approvals')} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {usage.isPending || !u
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[6.5rem]" />)
          : [
              <MetricCard
                key="storage"
                icon={HardDrive}
                label={t('usage.storage')}
                value={formatBytes(u.storage_bytes_used, i18n.language)}
                of={formatBytes(u.storage_bytes_included, i18n.language)}
                ratio={ratio(u.storage_bytes_used, u.storage_bytes_included)}
              />,
              <MetricCard
                key="seats"
                icon={Users}
                label={t('usage.seats')}
                value={String(u.seats_used)}
                of={String(u.seats_included)}
                ratio={ratio(u.seats_used, u.seats_included)}
              />,
              // No meter on these two: the API reports what has been used and
              // never says what is included, and a bar with an invented
              // denominator would be a lie drawn to scale.
              <MetricCard
                key="ai"
                icon={Sparkles}
                label={t('usage.aiCredits')}
                value={String(u.ai_credits_used)}
              />,
              <MetricCard
                key="envelopes"
                icon={PenLine}
                label={t('usage.envelopes')}
                value={String(u.signature_envelopes_used)}
              />,
            ]}
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
          <EmptyState icon={Clock} label={t('dashboard.noRecent')} />
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
          <EmptyState icon={Star} label={t('dashboard.noFavorites')} />
        )}
      </Section>
    </AppShell>
  )
}

/** Guards the divide-by-zero that an unlimited or unset allowance produces. */
function ratio(used: number, included: number): number | undefined {
  if (!Number.isFinite(included) || included <= 0) return undefined
  return Math.min(used / included, 1)
}

/**
 * One usage figure.
 *
 * The number is the largest thing in the card because it is the reason the
 * card exists — the previous version set it at the same 14px as its own label,
 * so four cards read as eight equally-important strings.
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  of,
  ratio,
}: {
  icon: typeof HardDrive
  label: string
  value: string
  of?: string
  /** 0–1. Omitted when the API does not publish an allowance. */
  ratio?: number
}) {
  // Amber at 80%, red at 95%: a meter that is only ever one colour tells you
  // nothing until you read the numbers, which is the moment it was meant to
  // save you.
  const bar =
    ratio === undefined
      ? ''
      : ratio >= 0.95
        ? 'bg-destructive'
        : ratio >= 0.8
          ? 'bg-amber-500'
          : 'bg-primary'

  return (
    <Card className="transition-shadow hover:shadow-pop">
      <CardContent className="p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </div>
        <p className="tabular mt-2 truncate text-2xl leading-none font-semibold">{value}</p>
        {of !== undefined && (
          <p className="text-muted-foreground tabular mt-1 truncate text-xs">/ {of}</p>
        )}
        {ratio !== undefined && (
          <div
            className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <div
              className={cn('h-full rounded-full transition-[width] duration-500', bar)}
              style={{ width: `${Math.max(ratio * 100, 2)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof HardDrive
  label: string
}) {
  return (
    <Link
      to={to}
      className="bg-card text-muted-foreground hover:text-foreground hover:border-ring/50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <SectionHeader title={title} />
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
