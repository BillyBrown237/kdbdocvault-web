import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gavel } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/vault-list'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  createLegalHold,
  legalHoldsQuery,
  meQuery,
  releaseLegalHold,
} from '@/lib/api/queries'
import type { LegalHold } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/legal-holds')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: LegalHoldsPage,
})

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

/**
 * W24 (B50): the holds admin panel. Documents are attached FROM their
 * detail page (« Placer sous gel ») — this page creates holds, shows what
 * they cover, and runs the two-administrator release.
 */
function LegalHoldsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const holds = useQuery(legalHoldsQuery)
  const me = useQuery(meQuery)

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const create = useMutation({
    mutationFn: () => createLegalHold(name.trim(), description.trim() || undefined),
    onSuccess: async () => {
      toast.success(t('holds.created'))
      setCreateOpen(false)
      setName('')
      setDescription('')
      await queryClient.invalidateQueries({ queryKey: ['legal-holds'] })
    },
    onError: (e) => fail(e, t),
  })

  // The release reason is REQUIRED by the API (it is recorded on the request
  // and in the audit trail), so the dialog collects it before we call —
  // sending nothing produced a server error rather than a prompt.
  const [releaseFor, setReleaseFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const release = useMutation({
    mutationFn: (holdId: string) => releaseLegalHold(holdId, reason.trim()),
    onSuccess: async (r) => {
      toast.success(
        r.status === 'released' ? t('holds.released') : t('holds.releasePending'),
      )
      setReleaseFor(null)
      setReason('')
      await queryClient.invalidateQueries({ queryKey: ['legal-holds'] })
    },
    onError: (e) => fail(e, t),
  })

  const list = holds.data?.data ?? []

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('holds.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('holds.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{t('holds.create')}</Button>
      </div>

      <div className="mt-4">
        {holds.isPending ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <EmptyState label={t('holds.empty')} />
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              {list.map((h, i) => (
                <div key={h.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <HoldRow
                    hold={h}
                    meId={me.data?.id}
                    locale={i18n.language}
                    releasing={release.isPending}
                    onRelease={() => {
                      setReason('')
                      setReleaseFor(h.id)
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('holds.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hold-name">{t('holds.name')}</Label>
              <Input
                id="hold-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('holds.namePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hold-desc">{t('holds.description')}</Label>
              <Textarea
                id="hold-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button disabled={create.isPending || !name.trim()} onClick={() => create.mutate()}>
              {create.isPending ? t('app.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release reason. Separate dialog rather than an inline field: this is
          the step that ends a legal obligation, and it should feel like a
          decision, not a button. */}
      <Dialog open={releaseFor !== null} onOpenChange={(o) => !o && setReleaseFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {list.find((h) => h.id === releaseFor)?.status === 'pending_release'
                ? t('holds.approveRelease')
                : t('holds.requestRelease')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('holds.reasonExplainer')}</p>
            <div className="space-y-1.5">
              <Label htmlFor="release-reason">{t('holds.reason')}</Label>
              <Textarea
                id="release-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('holds.reasonPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('holds.reasonMin', { count: Math.max(0, 10 - reason.trim().length) })}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={release.isPending || reason.trim().length < 10}
              onClick={() => releaseFor && release.mutate(releaseFor)}
            >
              {release.isPending ? t('app.loading') : t('holds.confirmRelease')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function HoldRow({
  hold,
  meId,
  locale,
  releasing,
  onRelease,
}: {
  hold: LegalHold
  meId?: string
  locale: string
  releasing: boolean
  onRelease: () => void
}) {
  const { t } = useTranslation()
  const iOpenedIt = hold.pending_release?.requested_by === meId

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{hold.name}</span>
          <StatusBadge domain="hold" status={hold.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t('holds.itemCount', { count: hold.item_count })} ·{' '}
          {formatDate(hold.created_at, locale)}
          {hold.description ? ` · ${hold.description}` : ''}
        </p>
        {hold.pending_release && (
          <p className="mt-0.5 text-xs text-amber-700">
            {iOpenedIt ? t('holds.awaitingOther') : t('holds.awaitingYou')}
          </p>
        )}
      </div>
      {hold.status !== 'released' && (
        <Button
          size="sm"
          variant="outline"
          disabled={releasing || (hold.status === 'pending_release' && iOpenedIt)}
          onClick={onRelease}
        >
          {hold.status === 'pending_release'
            ? t('holds.approveRelease')
            : t('holds.requestRelease')}
        </Button>
      )}
    </div>
  )
}
