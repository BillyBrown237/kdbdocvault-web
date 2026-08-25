import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmDestructive } from '@/lib/confirm'
import { ApiProblem, apiFetch } from '@/lib/api/http'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, fieldClass } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

/**
 * W33 — the owner's SSO screen (/tenant/sso, B70).
 *
 * Hand-rolled apiFetch rather than the generated client: the OpenAPI spec is
 * synced from the design source and has not been regenerated with the B70
 * shapes yet. Swap to orval hooks when it is — the wire shapes below are the
 * backend's, verbatim.
 *
 * The client secret is WRITE-ONLY end to end: the GET never returns it, the
 * form shows only "a secret is set", and leaving the field empty on save
 * means "keep the current one". Surfacing even a masked secret teaches
 * people that screens contain secrets.
 */

interface SsoConnection {
  id: string
  type: string
  display_name: string
  issuer: string
  client_id: string
  has_client_secret: boolean
  email_domains: string[]
  default_role: string
  enabled: boolean
  updated_at: string
}

const formSchema = z.object({
  displayName: z.string().trim().min(1, 'ssoSettings.nameRequired'),
  issuer: z
    .string()
    .trim()
    .refine((v) => v.startsWith('https://'), 'ssoSettings.issuerHttps'),
  clientId: z.string().trim().min(1, 'ssoSettings.clientIdRequired'),
  clientSecret: z.string(),
  emailDomains: z.string().trim().min(1, 'ssoSettings.domainsRequired'),
  defaultRole: z.enum(['member', 'admin']),
  enabled: z.boolean(),
})
type FormValues = z.infer<typeof formSchema>

export function SsoSettings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<SsoConnection | null>(null)
  const [problem, setProblem] = useState<unknown>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      issuer: '',
      clientId: '',
      clientSecret: '',
      emailDomains: '',
      defaultRole: 'member',
      enabled: true,
    },
  })

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch<{ configured: boolean; connection?: SsoConnection }>('/tenant/sso')
        if (r.configured && r.connection) {
          setExisting(r.connection)
          form.reset({
            displayName: r.connection.display_name,
            issuer: r.connection.issuer,
            clientId: r.connection.client_id,
            clientSecret: '',
            emailDomains: r.connection.email_domains.join(', '),
            defaultRole: r.connection.default_role === 'admin' ? 'admin' : 'member',
            enabled: r.connection.enabled,
          })
        }
      } catch (err) {
        setProblem(err)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    setProblem(null)
    try {
      const r = await apiFetch<{ configured: boolean; connection: SsoConnection }>('/tenant/sso', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: values.displayName,
          issuer: values.issuer,
          client_id: values.clientId,
          // Empty string -> omit -> the backend keeps the stored secret.
          client_secret: values.clientSecret.trim() || undefined,
          email_domains: values.emailDomains
            .split(/[\s,;]+/)
            .map((d) => d.trim())
            .filter(Boolean),
          default_role: values.defaultRole,
          enabled: values.enabled,
        }),
      })
      setExisting(r.connection)
      form.setValue('clientSecret', '')
      toast.success(t('ssoSettings.saved'))
    } catch (err) {
      // 409 SSO_DOMAIN_CLAIMED deserves its own sentence — it is the one
      // failure the owner cannot fix by re-reading their own form.
      if (err instanceof ApiProblem && err.status === 409) {
        setProblem(new Error(t('ssoSettings.domainClaimed')))
      } else {
        setProblem(err)
      }
    }
  })

  const onDelete = async () => {
    if (!confirmDestructive(t('ssoSettings.deleteConfirm'))) return
    try {
      await apiFetch<unknown>('/tenant/sso', { method: 'DELETE' })
      setExisting(null)
      form.reset()
      toast.success(t('ssoSettings.deleted'))
    } catch (err) {
      setProblem(err)
    }
  }

  // Every other tab under Settings is a Card with the same header shape; this
  // one was a bare div, so the SSO tab looked like a different page.
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t('app.loading')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const busy = form.formState.isSubmitting
  const errors = form.formState.errors

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4" />
          {t('ssoSettings.tab')}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-w-xl space-y-5">
        <p className="text-muted-foreground text-sm">{t('ssoSettings.intro')}</p>

        {problem !== null && <Callout problem={problem} />}

        <form className="space-y-4" noValidate onSubmit={(e) => void onSubmit(e)}>
          <fieldset disabled={busy} className="space-y-4">
            <FieldRow
              id="sso-name"
              label={t('ssoSettings.name')}
              error={errors.displayName?.message}
            >
              <Input
                id="sso-name"
                placeholder="Okta, Entra ID…"
                {...form.register('displayName')}
              />
            </FieldRow>

            <FieldRow
              id="sso-issuer"
              label={t('ssoSettings.issuer')}
              hint={t('ssoSettings.issuerHint')}
              error={errors.issuer?.message}
            >
              <Input
                id="sso-issuer"
                placeholder="https://login.example.com"
                autoComplete="off"
                {...form.register('issuer')}
              />
            </FieldRow>

            <FieldRow
              id="sso-client"
              label={t('ssoSettings.clientId')}
              error={errors.clientId?.message}
            >
              <Input id="sso-client" autoComplete="off" {...form.register('clientId')} />
            </FieldRow>

            <FieldRow
              id="sso-secret"
              label={t('ssoSettings.clientSecret')}
              hint={
                existing?.has_client_secret
                  ? t('ssoSettings.secretKept')
                  : t('ssoSettings.secretRequired')
              }
            >
              <Input
                id="sso-secret"
                type="password"
                autoComplete="new-password"
                {...form.register('clientSecret')}
              />
            </FieldRow>

            <FieldRow
              id="sso-domains"
              label={t('ssoSettings.domains')}
              hint={t('ssoSettings.domainsHint')}
              error={errors.emailDomains?.message}
            >
              <Input
                id="sso-domains"
                placeholder="acme.com, acme.cm"
                {...form.register('emailDomains')}
              />
            </FieldRow>

            <FieldRow
              id="sso-role"
              label={t('ssoSettings.defaultRole')}
              hint={t('ssoSettings.roleHint')}
            >
              <select id="sso-role" className={fieldClass} {...form.register('defaultRole')}>
                <option value="member">{t('roles.member')}</option>
                <option value="admin">{t('roles.admin')}</option>
              </select>
            </FieldRow>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch('enabled')}
                onCheckedChange={(v) => form.setValue('enabled', v)}
                aria-label={t('ssoSettings.enabled')}
              />
              <span className="text-sm">{t('ssoSettings.enabled')}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t('app.save')}
              </Button>
              {existing && (
                <Button type="button" variant="outline" onClick={() => void onDelete()}>
                  <Trash2 className="h-4 w-4" />
                  {t('ssoSettings.delete')}
                </Button>
              )}
            </div>
          </fieldset>
        </form>

        <p className="text-muted-foreground flex items-start gap-2 border-t pt-4 text-xs">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('ssoSettings.jitNote')}
        </p>
      </CardContent>
    </Card>
  )
}

function FieldRow({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {t(error)}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
