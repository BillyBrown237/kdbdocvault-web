import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'

import { notificationPrefsQuery, setNotificationPrefs } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/sonner'

/**
 * W27 (B56) — per-channel notification preferences.
 *
 * Only channels that actually deliver today get a switch. SMS, WhatsApp and
 * push are wired to log-only adapters, so offering a toggle for them would be
 * a promise the system can't keep; when a provider lands, the API already
 * returns them in `channels` and this list follows.
 */
const LIVE_CHANNELS = ['email']

export function NotificationPreferencesCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const prefs = useQuery(notificationPrefsQuery)

  // Local draft so toggling several switches is one save, not one PUT each.
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!prefs.data) return
    const next: Record<string, Record<string, boolean>> = {}
    for (const p of prefs.data.preferences) next[p.family] = { ...p.channels }
    setDraft(next)
    setDirty(false)
  }, [prefs.data])

  const save = useMutation({
    mutationFn: () =>
      setNotificationPrefs(
        Object.entries(draft).map(([family, channels]) => ({
          family,
          channels: Object.fromEntries(
            Object.entries(channels).filter(([c]) => LIVE_CHANNELS.includes(c)),
          ),
        })),
      ),
    onSuccess: async () => {
      toast.success(t('settings.saved'))
      setDirty(false)
      await queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
    onError: () => toast.error(t('errors.unknown')),
  })

  const families = prefs.data?.preferences ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          {t('notifPrefs.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informational, not a failure — Callout defaults to the error
            variant, which would paint this note red. */}
        <Callout variant="info">{t('notifPrefs.inAppAlwaysOn')}</Callout>

        {prefs.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : (
          <div className="space-y-3">
            {families.map((f) => (
              <div key={f.family} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t(`notifPrefs.family.${f.family}`)}</div>
                  <p className="text-xs text-muted-foreground">
                    {t(`notifPrefs.familyHint.${f.family}`)}
                  </p>
                </div>
                <Switch
                  checked={draft[f.family]?.email ?? true}
                  onCheckedChange={(v) => {
                    setDraft((d) => ({ ...d, [f.family]: { ...d[f.family], email: v } }))
                    setDirty(true)
                  }}
                  aria-label={t('notifPrefs.emailFor', {
                    family: t(`notifPrefs.family.${f.family}`),
                  })}
                />
              </div>
            ))}
          </div>
        )}

        <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? t('app.loading') : t('settings.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
