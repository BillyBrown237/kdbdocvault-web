import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Download } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  downloadExpiringCsv,
  reportActivityQuery,
  reportComplianceQuery,
  reportExposureQuery,
  reportExpiringQuery,
  reportOverviewQuery,
  reportWorkflowQuery,
} from '@/lib/api/queries'
import { formatBytes, formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/reports')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: ReportsPage,
})

/** W20: the six B46 reports, tabbed. Numbers are monospace — the evidence
 * texture (W22); gold is reserved for exactly one number per tab. */
function ReportsPage() {
  const { t } = useTranslation()
  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('reports.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="expiring">{t('reports.tabs.expiring')}</TabsTrigger>
          <TabsTrigger value="compliance">{t('reports.tabs.compliance')}</TabsTrigger>
          <TabsTrigger value="exposure">{t('reports.tabs.exposure')}</TabsTrigger>
          <TabsTrigger value="activity">{t('reports.tabs.activity')}</TabsTrigger>
          <TabsTrigger value="workflow">{t('reports.tabs.workflow')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="expiring" className="mt-4"><ExpiringTab /></TabsContent>
        <TabsContent value="compliance" className="mt-4"><ComplianceTab /></TabsContent>
        <TabsContent value="exposure" className="mt-4"><ExposureTab /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityTab /></TabsContent>
        <TabsContent value="workflow" className="mt-4"><WorkflowTab /></TabsContent>
      </Tabs>
    </AppShell>
  )
}

function Stat({ label, value, gold = false }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`font-mono text-2xl font-semibold ${gold ? 'text-amber-500' : ''}`}>
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
}

function OverviewTab() {
  const { t, i18n } = useTranslation()
  const q = useQuery(reportOverviewQuery)
  if (q.isPending) return <Skeleton className="h-48" />
  if (!q.data) return null
  const r = q.data
  return (
    <StatGrid>
      <Stat label={t('reports.ov.documents')} value={r.documents.active} />
      <Stat label={t('reports.ov.storage')} value={formatBytes(r.storage_bytes, i18n.language)} />
      <Stat label={t('reports.ov.members')} value={r.members_active} />
      <Stat label={t('reports.ov.expiring30')} value={r.expiring_in_30_days} gold />
      <Stat label={t('reports.ov.shares')} value={r.share_links_active} />
      <Stat
        label={t('reports.ov.envelopes')}
        value={`${r.envelopes.open} / ${r.envelopes.completed}`}
      />
      <Stat label={t('reports.ov.workflows')} value={r.workflows_running} />
      <Stat label={t('reports.ov.obligations')} value={r.obligations_open} />
    </StatGrid>
  )
}

function ExpiringTab() {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState(90)
  const q = useQuery(reportExpiringQuery(days))

  async function csv() {
    try {
      const blob = await downloadExpiringCsv(days)
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `expiring-${days}d.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(
        err instanceof NetworkError
          ? t('errors.network')
          : err instanceof ApiProblem
            ? (err.detail ?? err.title)
            : t('errors.unknown'),
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[30, 60, 90, 180, 365].map((d) => (
              <SelectItem key={d} value={String(d)}>
                {t('reports.exp.within', { count: d })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void csv()}>
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>
      {q.isPending ? (
        <Skeleton className="h-40" />
      ) : (
        <Card>
          <CardContent className="p-4">
            {q.data?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('reports.exp.none')}</p>
            ) : (
              <div className="space-y-2 text-sm">
                {q.data?.data.map((row, i) => (
                  <div key={`${row.document_id}-${i}`}>
                    {i > 0 && <Separator className="mb-2" />}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: row.document_id }}
                        className="min-w-0 flex-1 truncate font-medium hover:underline"
                      >
                        {row.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {row.owner_name ?? '—'}
                      </span>
                      <span className="font-mono text-xs">
                        {formatDate(row.key_date, i18n.language)}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          row.days_left <= 7 ? 'text-red-600' : row.days_left <= 30 ? 'text-amber-600' : ''
                        }`}
                      >
                        J-{row.days_left}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ComplianceTab() {
  const { t } = useTranslation()
  const q = useQuery(reportComplianceQuery)
  if (q.isPending) return <Skeleton className="h-48" />
  if (!q.data) return null
  const r = q.data
  return (
    <StatGrid>
      <Stat label={t('reports.co.coverage')} value={`${r.retention_coverage_pct}%`} gold />
      <Stat label={t('reports.co.withRule')} value={`${r.with_lifecycle_rule} / ${r.documents_active}`} />
      <Stat label={t('reports.co.unclassified')} value={r.unclassified} />
      <Stat label={t('reports.co.orphaned')} value={r.orphaned} />
      <Stat label={t('reports.co.held')} value={r.under_legal_hold} />
      <Stat label={t('reports.co.holds')} value={r.holds_active} />
      <Stat label={t('reports.co.overdue')} value={r.obligations_overdue} />
      <Stat label={t('reports.co.pendingRules')} value={r.rules_pending_confirmation} />
    </StatGrid>
  )
}

function ExposureTab() {
  const { t } = useTranslation()
  const q = useQuery(reportExposureQuery)
  if (q.isPending) return <Skeleton className="h-48" />
  if (!q.data) return null
  const r = q.data
  return (
    <div className="space-y-3">
      <StatGrid>
        <Stat label={t('reports.ex.active')} value={r.links.active} gold />
        <Stat label={t('reports.ex.noPassword')} value={r.links.active - r.links.password_protected} />
        <Stat label={t('reports.ex.noExpiry')} value={r.links.without_expiry} />
        <Stat label={t('reports.ex.views')} value={r.views_30d} />
        <Stat label={t('reports.ex.viewers')} value={r.unique_viewers_30d} />
        <Stat label={t('reports.ex.rooms')} value={r.rooms.open} />
        <Stat label={t('reports.ex.visitors')} value={r.rooms.visitors} />
        <Stat label={t('reports.ex.watermarked')} value={r.links.watermarked} />
      </StatGrid>
      {r.top_shared.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('reports.ex.top')}
            </p>
            {r.top_shared.map((d) => (
              <div key={d.document_id} className="flex items-center justify-between gap-2">
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: d.document_id }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {d.title}
                </Link>
                <span className="font-mono text-xs">{t('reports.ex.viewCount', { count: d.views })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ActivityTab() {
  const { t } = useTranslation()
  const q = useQuery(reportActivityQuery())
  if (q.isPending) return <Skeleton className="h-48" />
  if (!q.data) return null
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-xs text-muted-foreground">
          {t('reports.ac.period', { from: q.data.from, to: q.data.to })}
        </p>
        {q.data.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('reports.ac.none')}</p>
        ) : (
          q.data.members.map((m, i) => (
            <div key={m.user_id ?? i}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{m.name ?? m.email ?? '—'}</span>
                <span className="font-mono text-sm">{t('reports.ac.total', { count: m.total })}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {Object.entries(m.actions)
                  .slice(0, 6)
                  .map(([action, n]) => `${action} ×${n}`)
                  .join(' · ')}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function WorkflowTab() {
  const { t } = useTranslation()
  const q = useQuery(reportWorkflowQuery)
  if (q.isPending) return <Skeleton className="h-48" />
  if (!q.data) return null
  const r = q.data
  return (
    <div className="space-y-3">
      <StatGrid>
        <Stat label={t('reports.wf.started')} value={r.started_90d} />
        <Stat label={t('reports.wf.completed')} value={r.completed_90d} />
        <Stat
          label={t('reports.wf.avgHours')}
          value={r.avg_completion_hours === null ? '—' : `${r.avg_completion_hours} h`}
        />
        <Stat label={t('reports.wf.overdue')} value={r.overdue_open_steps} gold />
      </StatGrid>
      {r.by_template.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('reports.wf.byTemplate')}
            </p>
            {r.by_template.map((tpl) => (
              <div key={tpl.template_id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate">{tpl.name}</span>
                <StatusBadge domain="workflow" status="completed" className="hidden sm:inline-flex" />
                <span className="font-mono text-xs">
                  ×{tpl.completed} · {tpl.avg_hours === null ? '—' : `${tpl.avg_hours} h`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
