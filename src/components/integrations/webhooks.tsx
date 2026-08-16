import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Webhook as WebhookIcon } from 'lucide-react'

import {
  createWebhook,
  deleteWebhook,
  replayWebhook,
  retryDelivery,
  updateWebhook,
  webhookDeliveriesQuery,
  webhooksQuery,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/sonner'

/**
 * W28 (B60) — webhook subscriptions and their delivery log.
 *
 * The delivery log is the point of this screen. Anyone can POST a URL into a
 * form; what an integrator actually needs at 2am is "did it arrive, what did
 * you get back, and can I send it again" — so deliveries are one click from
 * the subscription, showing response code or the network error verbatim.
 */
export function WebhooksCard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const hooks = useQuery(webhooksQuery)

  const [creating, setCreating] = useState(false)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [openLog, setOpenLog] = useState<string | null>(null)

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
    else toast.error(t('errors.unknown'))
  }
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })

  const create = useMutation({
    mutationFn: () => createWebhook({ url: url.trim(), events, secret }),
    onSuccess: async () => {
      toast.success(t('integrations.hookCreated'))
      setCreating(false)
      setUrl('')
      setSecret('')
      setEvents([])
      await invalidate()
    },
    onError: fail,
  })

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateWebhook(id, { active }),
    onSuccess: invalidate,
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async () => {
      toast.success(t('integrations.hookDeleted'))
      await invalidate()
    },
    onError: fail,
  })

  const available = hooks.data?.available_events ?? []
  const signature = hooks.data?.signature
  const rows = hooks.data?.data ?? []

  /** A 32-char secret the user never has to invent. */
  const suggestSecret = () => {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    setSecret(btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, ''))
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <WebhookIcon className="h-4 w-4" />
          {t('integrations.webhooks')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('integrations.webhooksExplainer')}</p>

        {rows.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground">{t('integrations.noHooks')}</p>
        )}

        {rows.map((h, i) => (
          <div key={h.id}>
            {i > 0 && <Separator className="mb-3" />}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="truncate font-mono text-sm">{h.url}</div>
                <div className="flex flex-wrap gap-1">
                  {h.events.map((e) => (
                    <Badge key={e} variant="outline" className="font-mono text-[10px]">
                      {e}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(h.created_at, i18n.language)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={h.active}
                  aria-label={t('integrations.active')}
                  disabled={toggle.isPending}
                  onCheckedChange={(v) => toggle.mutate({ id: h.id, active: v })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenLog(openLog === h.id ? null : h.id)}
                >
                  {t('integrations.deliveries')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-600"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(h.id)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
            {openLog === h.id && <DeliveryLog webhookId={h.id} />}
          </div>
        ))}

        <Separator />

        {creating ? (
          <div className="space-y-4 rounded-md border p-3">
            <div className="space-y-1.5">
              <Label htmlFor="hook-url">{t('integrations.url')}</Label>
              <Input
                id="hook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/hooks/kdbvault"
              />
              <p className="text-xs text-muted-foreground">{t('integrations.urlHint')}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hook-secret">{t('integrations.secret')}</Label>
              <div className="flex gap-2">
                <Input
                  id="hook-secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={suggestSecret}>
                  {t('integrations.generate')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('integrations.secretHint')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('integrations.events')}</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {available.map((e) => (
                  <label key={e} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={events.includes(e)}
                      onChange={(ev) =>
                        setEvents((cur) =>
                          ev.target.checked ? [...cur, e] : cur.filter((x) => x !== e),
                        )
                      }
                    />
                    <span className="font-mono text-xs">{e}</span>
                  </label>
                ))}
              </div>
            </div>

            {signature && (
              <Callout variant="info">
                {t('integrations.signatureHint', {
                  header: signature.header,
                  algorithm: signature.algorithm,
                })}
              </Callout>
            )}

            <div className="flex gap-2">
              <Button
                disabled={
                  create.isPending || !url.trim() || secret.length < 16 || events.length === 0
                }
                onClick={() => create.mutate()}
              >
                {create.isPending ? t('app.loading') : t('common.create')}
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            {t('integrations.newHook')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/** The answer to "did it arrive?" — with the verbatim error when it didn't. */
function DeliveryLog({ webhookId }: { webhookId: string }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const deliveries = useQuery(webhookDeliveriesQuery(webhookId))

  const [replaying, setReplaying] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const retry = useMutation({
    mutationFn: (deliveryId: string) => retryDelivery(webhookId, deliveryId),
    onSuccess: async () => {
      toast.success(t('integrations.retryQueued'))
      await queryClient.invalidateQueries({ queryKey: ['webhooks', 'deliveries', webhookId] })
    },
    onError: () => toast.error(t('errors.unknown')),
  })

  const replay = useMutation({
    mutationFn: () =>
      replayWebhook(webhookId, {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      }),
    onSuccess: async (r) => {
      toast.success(t('integrations.replayQueued', { count: r.queued }))
      setReplaying(false)
      await queryClient.invalidateQueries({ queryKey: ['webhooks', 'deliveries', webhookId] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiProblem ? (e.detail ?? e.title) : t('errors.unknown')),
  })

  const rows = deliveries.data?.data ?? []

  return (
    <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      {deliveries.isPending ? (
        <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('integrations.noDeliveries')}</p>
      ) : (
        rows.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="font-mono">{d.event_type}</span>
              <span className="ml-2 text-muted-foreground">
                {formatDate(d.created_at, i18n.language)}
              </span>
              {d.error && <div className="mt-0.5 text-red-600">{d.error}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {d.response_code && <span className="font-mono">{d.response_code}</span>}
              <span className="text-muted-foreground">
                {t('integrations.attemptN', { n: d.attempt })}
              </span>
              <StatusBadge domain="job" status={mapStatus(d.status)} />
              {d.status !== 'delivered' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(d.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      <Separator />

      {replaying ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t('integrations.from')}</Label>
            <Input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 w-52"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('integrations.to')}</Label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 w-52"
            />
          </div>
          <Button size="sm" disabled={replay.isPending || !from || !to} onClick={() => replay.mutate()}>
            {replay.isPending ? t('app.loading') : t('integrations.replay')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReplaying(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setReplaying(true)}>
          {t('integrations.replayRange')}
        </Button>
      )}
    </div>
  )
}

/** delivery_status has no StatusBadge domain of its own; `job` carries the
 * same meanings (queued/running/done/failed) with the right tones. */
function mapStatus(s: string): string {
  return s === 'delivered' ? 'done' : s === 'failed' ? 'failed' : 'queued'
}
