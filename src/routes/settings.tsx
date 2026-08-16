import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { Download, Monitor, ShieldCheck } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NotificationPreferencesCard } from '@/components/settings/notification-preferences'
import { SecurityPolicyCard } from '@/components/settings/security-policy'
import { SecretReveal } from '@/components/ui/secret-reveal'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  changePassword,
  createDocumentType,
  createTenantExport,
  deleteDocumentType,
  documentTypesQuery,
  updateDocumentType,
  meQuery,
  revokeSession,
  sessionsQuery,
  tenantQuery,
  totpConfirm,
  totpDisable,
  totpSetup,
  updateProfile,
} from '@/lib/api/queries'
import { useJob } from '@/lib/use-job'
import { requireTenant } from '@/lib/route-guards'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/settings')({
  beforeLoad: ({ location }) => requireTenant(location),
  component: SettingsPage,
})

function fail(err: unknown, t: (k: string) => string) {
  if (err instanceof NetworkError) toast.error(t('errors.network'))
  else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
  else toast.error(t('errors.unknown'))
}

function SettingsPage() {
  const { t } = useTranslation()
  const me = useQuery(meQuery)
  const tenant = useQuery(tenantQuery)
  // Same courtesy gating as the app shell (B47): backend enforces, UI hides.
  const role = me.data?.memberships.find((m) => m.tenant_id === tenant.data?.id)?.role
  const isOwner = role === 'Owner'
  // Admins READ the security policy; only owners can change it (B57).
  const isAdmin = isOwner || role === 'Admin'

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
      <Tabs defaultValue="profile" className="mt-4">
        <TabsList>
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('settings.sessions')}</TabsTrigger>
          <TabsTrigger value="types">{t('docTypes.tab')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notifPrefs.tab')}</TabsTrigger>
          {isAdmin && <TabsTrigger value="policy">{t('secPolicy.tab')}</TabsTrigger>}
          {isOwner && <TabsTrigger value="export">{t('settings.exportTab')}</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security">
          <PasswordCard />
          <TotpCard />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsCard />
        </TabsContent>
        <TabsContent value="types">
          <DocumentTypesCard />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationPreferencesCard />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="policy">
            <SecurityPolicyCard canEdit={isOwner} />
          </TabsContent>
        )}
        {isOwner && (
          <TabsContent value="export">
            <TenantExportCard />
          </TabsContent>
        )}
      </Tabs>
    </AppShell>
  )
}

/**
 * B52/W25 — the §19 exit guarantee, visible. One button, one ZIP: every
 * document (original bytes, folder tree preserved), metadata.csv, the full
 * audit chain, signature evidence. Owner-only; the tab isn't rendered for
 * other roles.
 */
function TenantExportCard() {
  const { t } = useTranslation()
  const { job, running, start } = useJob()

  const request = useMutation({
    mutationFn: createTenantExport,
    onSuccess: (j) => start(j),
    onError: (e) => fail(e, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Download className="h-4 w-4" />
          {t('settings.exportTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('settings.exportExplainer')}</p>
        {job?.status === 'done' && job.result_url ? (
          <div className="space-y-3">
            <p className="text-sm">{t('settings.exportReady')}</p>
            <Button asChild>
              <a href={job.result_url} download>
                <Download className="mr-2 h-4 w-4" />
                {t('settings.exportDownload')}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">{t('settings.exportLinkHint')}</p>
          </div>
        ) : job?.status === 'failed' ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{job.error ?? t('errors.unknown')}</p>
            <Button onClick={() => request.mutate()} disabled={request.isPending}>
              {t('settings.exportRetry')}
            </Button>
          </div>
        ) : running ? (
          <p className="text-sm text-muted-foreground">{t('settings.exportRunning')}</p>
        ) : (
          <Button onClick={() => request.mutate()} disabled={request.isPending}>
            {request.isPending ? t('app.loading') : t('settings.exportStart')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ProfileTab() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const me = useQuery(meQuery)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (me.data) {
      setName(me.data.name ?? '')
      setPhone(me.data.phone ?? '')
    }
  }, [me.data])

  const save = useMutation({
    mutationFn: () => updateProfile({ name, phone, locale: i18n.language.startsWith('fr') ? 'fr' : 'en' }),
    onSuccess: async () => {
      toast.success(t('settings.saved'))
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (e) => fail(e, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('settings.profile')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('auth.login.identifier')}</Label>
          <Input value={me.data?.email ?? ''} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('settings.name')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('settings.phone')}</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? t('app.loading') : t('settings.save')}
        </Button>
      </CardContent>
    </Card>
  )
}

function PasswordCard() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')

  const change = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast.success(t('settings.passwordChanged'))
      setCurrent('')
      setNext('')
    },
    onError: (e) => fail(e, t),
  })

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('settings.changePassword')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cur">{t('settings.currentPassword')}</Label>
          <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new">{t('settings.newPassword')}</Label>
          <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <Button onClick={() => change.mutate()} disabled={change.isPending || !current || next.length < 10}>
          {change.isPending ? t('app.loading') : t('settings.save')}
        </Button>
      </CardContent>
    </Card>
  )
}

function TotpCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const me = useQuery(meQuery)
  const [qr, setQr] = useState<string | null>(null)
  // W29: the seed itself, pulled out of the otpauth URI. Authenticator apps
  // accept a typed key when a camera isn't available — and setting up 2FA on
  // the same device you're reading this on is the common case, not the edge.
  const [secretKey, setSecretKey] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [disablePw, setDisablePw] = useState('')

  const begin = useMutation({
    mutationFn: totpSetup,
    onSuccess: async (r) => {
      setQr(await QRCode.toDataURL(r.otpauth_uri))
      setSecretKey(new URL(r.otpauth_uri).searchParams.get('secret'))
    },
    onError: (e) => fail(e, t),
  })
  const confirm = useMutation({
    mutationFn: () => totpConfirm(code),
    onSuccess: async () => {
      toast.success(t('settings.totpEnabled'))
      setQr(null)
      setSecretKey(null)
      setCode('')
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (e) => fail(e, t),
  })
  const disable = useMutation({
    mutationFn: () => totpDisable(disablePw, code),
    onSuccess: async () => {
      toast.success(t('settings.totpDisabled'))
      setDisablePw('')
      setCode('')
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (e) => fail(e, t),
  })

  const enabled = me.data?.mfa_enabled

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {t('settings.twoFactor')}
          {enabled && <Badge variant="success">{t('settings.enabled')}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('settings.totpOn')}</p>
            <div className="space-y-1.5">
              <Label>{t('auth.login.password')}</Label>
              <Input type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.currentCode')}</Label>
              <Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-600"
              disabled={disable.isPending || !disablePw || !code}
              onClick={() => disable.mutate()}
            >
              {t('settings.disable2fa')}
            </Button>
          </div>
        ) : qr ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('settings.scanQr')}</p>
            <img src={qr} alt="TOTP QR" className="h-44 w-44 rounded-md border" />
            {/* W29: a QR code is useless to someone setting up on the SAME
                device, or using a manager that takes a typed seed. The secret
                is masked by default — this one is worth shoulder-surfing. */}
            {secretKey && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t('settings.manualKey')}</Label>
                <SecretReveal
                  value={secretKey}
                  masked
                  envKey="KDB_TOTP_SECRET"
                  filenameBase="kdbvault-authenticator"
                  title={t('settings.totpFileTitle')}
                  usage={t('settings.totpFileUsage')}
                  meta={{ [t('auth.login.identifier')]: me.data?.email ?? '' }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t('settings.currentCode')}</Label>
              <Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button disabled={confirm.isPending || !code} onClick={() => confirm.mutate()}>
              {confirm.isPending ? t('app.loading') : t('settings.enable2fa')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('settings.totpOff')}</p>
            <Button onClick={() => begin.mutate()} disabled={begin.isPending}>
              {begin.isPending ? t('app.loading') : t('settings.setup2fa')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SessionsCard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const sessions = useQuery(sessionsQuery)

  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: async () => {
      toast.success(t('settings.sessionRevoked'))
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (e) => fail(e, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('settings.activeSessions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.isPending ? (
          <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : (
          sessions.data?.data.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <Separator className="mb-2" />}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {s.device || t('settings.unknownDevice')}
                      {s.current && (
                        <Badge variant="secondary" className="ml-2">
                          {t('settings.thisDevice')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.ip} · {formatDate(s.last_active_at, i18n.language)}
                    </div>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-600"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(s.id)}
                  >
                    {t('settings.revoke')}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Document types classify documents and act as a search facet.
 *
 * Honest limitation: the backend maps list + create only. There is no
 * `PATCH /documents/{id}`, so nothing in the API can attach a type to an
 * existing document yet — types are created here and used as a filter, and
 * assignment lands when the backend grows the endpoint.
 */
function DocumentTypesCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const types = useQuery(documentTypesQuery)
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const invalidateTypes = () =>
    queryClient.invalidateQueries({ queryKey: ['document-types'] })

  const create = useMutation({
    mutationFn: () => createDocumentType(name.trim()),
    onSuccess: async () => {
      setName('')
      toast.success(t('docTypes.created'))
      await invalidateTypes()
    },
    onError: (err) => fail(err, t),
  })

  // B55: rename + delete-if-unused. The 409 carries the count of documents
  // still using the type, so surfacing the server's detail beats a generic
  // "couldn't delete".
  const rename = useMutation({
    mutationFn: (typeId: string) => updateDocumentType(typeId, { name: renameValue.trim() }),
    onSuccess: async () => {
      setRenaming(null)
      toast.success(t('docTypes.renamed'))
      await invalidateTypes()
    },
    onError: (err) => fail(err, t),
  })

  const remove = useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: async () => {
      toast.success(t('docTypes.deleted'))
      await invalidateTypes()
    },
    onError: (err) => fail(err, t),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{t('docTypes.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('docTypes.explainer')}</p>

        {types.data && types.data.data.length > 0 && (
          <div className="space-y-2">
            {types.data.data.map((ty) => (
              <div key={ty.id} className="flex items-center justify-between gap-2">
                <Badge variant={ty.is_system ? 'secondary' : 'outline'}>
                  {ty.name}
                  {ty.is_system && (
                    <span className="ml-1 text-[10px] opacity-70">{t('docTypes.system')}</span>
                  )}
                </Badge>
                {/* B55: system types are shared across every organisation, so
                    they have no controls at all — better than showing buttons
                    that answer 422. */}
                {!ty.is_system &&
                  (renaming === ty.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8 w-48"
                      />
                      <Button
                        size="sm"
                        disabled={rename.isPending || !renameValue.trim()}
                        onClick={() => rename.mutate(ty.id)}
                      >
                        {t('common.done')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRenaming(ty.id)
                          setRenameValue(ty.name)
                        }}
                      >
                        {t('common.rename')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-600"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(ty.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        <Separator />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) create.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">{t('docTypes.name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('docTypes.namePlaceholder')}
              className="w-56"
            />
          </div>
          <Button type="submit" disabled={create.isPending || !name.trim()}>
            {create.isPending ? t('app.loading') : t('common.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
