import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'

import { securityPolicyQuery, setSecurityPolicy } from '@/lib/api/queries'
import { ApiProblem } from '@/lib/api/http'
import type { SecurityPolicy } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'

/**
 * W27 (B57) — the organisation's security rules, owner-only.
 *
 * Every switch here changes what OTHER people can do, so each one states its
 * consequence in plain language rather than restating its own label. The two
 * that can lock someone out (MFA, IP allowlist) say so before you save; the
 * backend refuses an allowlist that excludes your own address, and the hint
 * explains that rule instead of letting a 422 be the first you hear of it.
 */
export function SecurityPolicyCard({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const policy = useQuery(securityPolicyQuery)

  const [draft, setDraft] = useState<SecurityPolicy | null>(null)
  const [allowlistText, setAllowlistText] = useState('')

  useEffect(() => {
    if (!policy.data) return
    setDraft(policy.data)
    setAllowlistText(policy.data.ip_allowlist.join('\n'))
  }, [policy.data])

  const save = useMutation({
    mutationFn: () =>
      setSecurityPolicy({
        ...draft!,
        ip_allowlist: allowlistText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      toast.success(t('settings.saved'))
      await queryClient.invalidateQueries({ queryKey: ['security-policy'] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiProblem ? (e.detail ?? e.title) : t('errors.unknown')),
  })

  if (!draft) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  const set = <K extends keyof SecurityPolicy>(k: K, v: SecurityPolicy[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4" />
          {t('secPolicy.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!canEdit && <Callout variant="info">{t('secPolicy.ownerOnly')}</Callout>}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium">{t('secPolicy.requireMfa')}</div>
            <p className="text-xs text-muted-foreground">{t('secPolicy.requireMfaHint')}</p>
          </div>
          <Switch
            checked={draft.require_mfa}
            disabled={!canEdit}
            aria-label={t('secPolicy.requireMfa')}
            onCheckedChange={(v) => set('require_mfa', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="session-days">{t('secPolicy.sessionDays')}</Label>
          <Input
            id="session-days"
            type="number"
            min={1}
            max={365}
            className="w-32"
            disabled={!canEdit}
            value={draft.session_max_days}
            onChange={(e) => set('session_max_days', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">{t('secPolicy.sessionDaysHint')}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="allowlist">{t('secPolicy.ipAllowlist')}</Label>
          <Textarea
            id="allowlist"
            rows={3}
            disabled={!canEdit}
            value={allowlistText}
            onChange={(e) => setAllowlistText(e.target.value)}
            placeholder={'203.0.113.4\n41.202.0.0/16'}
          />
          <p className="text-xs text-muted-foreground">{t('secPolicy.ipAllowlistHint')}</p>
        </div>

        <Separator />
        <div className="text-sm font-medium">{t('secPolicy.sharing')}</div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm">{t('secPolicy.externalAllowed')}</div>
            <p className="text-xs text-muted-foreground">{t('secPolicy.externalAllowedHint')}</p>
          </div>
          <Switch
            checked={draft.share_external_allowed}
            disabled={!canEdit}
            aria-label={t('secPolicy.externalAllowed')}
            onCheckedChange={(v) => set('share_external_allowed', v)}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm">{t('secPolicy.requirePassword')}</div>
            <p className="text-xs text-muted-foreground">{t('secPolicy.requirePasswordHint')}</p>
          </div>
          <Switch
            checked={draft.share_require_password}
            disabled={!canEdit || !draft.share_external_allowed}
            aria-label={t('secPolicy.requirePassword')}
            onCheckedChange={(v) => set('share_require_password', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="share-days">{t('secPolicy.shareMaxDays')}</Label>
          <Input
            id="share-days"
            type="number"
            min={1}
            max={365}
            className="w-32"
            disabled={!canEdit || !draft.share_external_allowed}
            value={draft.share_max_days ?? ''}
            placeholder={t('secPolicy.noLimit')}
            onChange={(e) =>
              set('share_max_days', e.target.value === '' ? null : Number(e.target.value))
            }
          />
          <p className="text-xs text-muted-foreground">{t('secPolicy.shareMaxDaysHint')}</p>
        </div>

        {canEdit && (
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? t('app.loading') : t('settings.save')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
