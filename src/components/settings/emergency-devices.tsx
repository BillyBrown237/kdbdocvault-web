import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeBuoy, Smartphone } from 'lucide-react'

import {
  createEmergencyContact,
  deleteEmergencyContact,
  devicesQuery,
  emergencyContactsQuery,
  unregisterDevice,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import type { CreatedEmergencyContact } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { enablePush, pushSubscribed, pushSupported } from '@/lib/push'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
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
import { SecretReveal } from '@/components/ui/secret-reveal'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'

function useFail() {
  const { t } = useTranslation()
  return (e: unknown) => {
    if (e instanceof NetworkError) toast.error(t('errors.network'))
    else if (e instanceof ApiProblem) toast.error(e.detail ?? e.title)
    else toast.error(t('errors.unknown'))
  }
}

/**
 * W31 (B65) — the dead man's switch.
 *
 * The screen leads with the veto, not the nomination, because the fear this
 * feature creates is "someone could take my documents" and the answer is
 * "you get told, and you can refuse". Removing a contact IS the refusal, so
 * the delete button is the same control in both stories.
 */
export function EmergencyContactsCard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const contacts = useQuery(emergencyContactsQuery)
  const fail = useFail()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('72')
  const [revealed, setRevealed] = useState<CreatedEmergencyContact | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] })

  const create = useMutation({
    mutationFn: () =>
      createEmergencyContact({
        name: name.trim(),
        email: email.trim(),
        veto_window_hours: Number(hours),
      }),
    onSuccess: async (r) => {
      setRevealed(r)
      setOpen(false)
      setName('')
      setEmail('')
      await invalidate()
    },
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: deleteEmergencyContact,
    onSuccess: async () => {
      toast.success(t('emergency.removed'))
      await invalidate()
    },
    onError: fail,
  })

  const list = contacts.data?.data ?? []
  const pending = list.filter((c) => c.status === 'access_requested')

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <LifeBuoy className="h-4 w-4" />
          {t('emergency.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('emergency.explainer')}</p>

        {/* A pending request is the only thing on this page that is urgent. */}
        {pending.map((c) => (
          <Callout key={c.id} variant="warning">
            {t('emergency.pending', {
              name: c.name,
              when: c.access_requested_at
                ? formatDate(c.access_requested_at, i18n.language)
                : '',
              hours: c.veto_window_hours,
            })}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => remove.mutate(c.id)}>
                {t('emergency.veto')}
              </Button>
            </div>
          </Callout>
        ))}

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emergency.empty')}</p>
        ) : (
          <div className="space-y-2">
            {list.map((c, i) => (
              <div key={c.id}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">
                      {c.name}
                      {c.status === 'access_granted' && (
                        <Badge variant="destructive" className="ml-2">
                          {t('emergency.granted')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.email} · {t('emergency.window', { hours: c.veto_window_hours })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-600"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(c.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {t('emergency.add')}
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('emergency.add')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t('emergency.name')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('emergency.email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('emergency.windowLabel')}</Label>
                <Input
                  type="number"
                  min={24}
                  max={720}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('emergency.windowHint')}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                disabled={create.isPending || !name.trim() || !email.trim()}
                onClick={() => create.mutate()}
              >
                {create.isPending ? t('app.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* The grant token: shown once, and it must reach a person who cannot
            reach YOU — so downloading it matters more here than anywhere. */}
        <Dialog open={revealed !== null} onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-lg"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{t('emergency.tokenTitle')}</DialogTitle>
            </DialogHeader>
            <Callout variant="warning">{t('emergency.tokenOnce')}</Callout>
            {revealed && (
              <SecretReveal
                value={revealed.grant_token}
                filenameBase={`kdbvault-emergency-${revealed.contact.name.toLowerCase().replace(/\W+/g, '-')}`}
                title={t('emergency.tokenFileTitle', { name: revealed.contact.name })}
                usage={t('emergency.tokenUsage')}
                meta={{
                  [t('emergency.name')]: revealed.contact.name,
                  [t('emergency.email')]: revealed.contact.email,
                }}
              />
            )}
            <DialogFooter>
              <Button onClick={() => setRevealed(null)}>{t('integrations.secretSaved')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

/** W31/W32 (B64+B67) — registered devices, and turning push on for THIS
 * browser. */
export function DevicesCard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const devices = useQuery(devicesQuery)
  const fail = useFail()

  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  useEffect(() => {
    void pushSubscribed().then(setSubscribed)
  }, [])

  const remove = useMutation({
    mutationFn: unregisterDevice,
    onSuccess: async () => {
      toast.success(t('devices.removed'))
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: fail,
  })

  const enable = useMutation({
    mutationFn: async () => {
      const key = devices.data?.delivery.vapid_public_key
      if (!key) throw new Error('no key')
      return enablePush(key)
    },
    onSuccess: async (r) => {
      if (r.ok) {
        setSubscribed(true)
        toast.success(t('devices.enabled'))
        await queryClient.invalidateQueries({ queryKey: ['devices'] })
      } else {
        // Each failure means something different to the person, and
        // "denied" in particular cannot be fixed by trying again.
        toast.error(t(`devices.failed.${r.reason}`))
      }
    },
    onError: () => toast.error(t('errors.unknown')),
  })

  const list = devices.data?.data ?? []
  const delivery = devices.data?.delivery

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          {t('devices.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* The server tells us push isn't wired; repeating it here beats a
            silent list of devices that never receive anything. */}
        {delivery && !delivery.enabled && (
          <Callout variant="info">{t('devices.notEnabled')}</Callout>
        )}

        {/* Turning push on can only happen from a click — browsers refuse a
            permission prompt that isn't tied to a user gesture. */}
        {delivery?.web_enabled && pushSupported() && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">{t('devices.thisBrowser')}</div>
              <p className="text-xs text-muted-foreground">
                {subscribed ? t('devices.alreadyOn') : t('devices.enableHint')}
              </p>
            </div>
            <Button
              size="sm"
              variant={subscribed ? 'outline' : 'default'}
              disabled={enable.isPending || subscribed === true}
              onClick={() => enable.mutate()}
            >
              {subscribed ? t('devices.on') : t('devices.enable')}
            </Button>
          </div>
        )}

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('devices.empty')}</p>
        ) : (
          list.map((d, i) => (
            <div key={d.id}>
              {i > 0 && <Separator className="mb-2" />}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm">{t(`devices.platform.${d.platform}`)}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {d.token_preview} · {formatDate(d.created_at, i18n.language)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-600"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(d.id)}
                >
                  {t('devices.remove')}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
