import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Fingerprint, Loader2, Lock } from 'lucide-react'
import { z } from 'zod'

import { login, setPendingChallenge, ssoStart } from '@/lib/auth'
import { NetworkError } from '@/lib/api/http'
import { flags } from '@/lib/flags'
import { AuthHeading, AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const searchSchema = z.object({
  redirect: z.string().optional(),
  expired: z.boolean().optional(),
})

/**
 * `identifier`, not `email`.
 *
 * The API takes an identifier and the field has always been labelled "Email
 * or phone" — validating it as an email address would lock out every account
 * that signs in with a number. So the rule is "not empty", the message names
 * both, and `autocomplete="username"` is the correct token for a field that
 * may hold either. Narrow this the day the backend narrows.
 */
const formSchema = z.object({
  identifier: z.string().trim().min(1, 'auth.login.identifierRequired'),
  password: z.string().min(1, 'auth.login.passwordRequired'),
})
type FormValues = z.infer<typeof formSchema>

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const search = Route.useSearch()
  // Form-level errors render as a calm Callout, not a toast (W23): the
  // message stays put while the user re-reads what they typed.
  const [problem, setProblem] = useState<unknown>(null)
  // W33: the SSO button's own feedback line. A string key, not a boolean —
  // "type your work email first" and "no SSO for that domain" are different
  // answers and deserve different sentences.
  const [ssoHint, setSsoHint] = useState<string | null>(null)
  const [ssoBusy, setSsoBusy] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '', password: '' },
    // Errors appear when a field is left, not on every keystroke — nothing is
    // marked wrong before there was a chance to finish it.
    mode: 'onBlur',
  })

  const busy = form.formState.isSubmitting
  const errors = form.formState.errors

  // W33: SSO starts from the email the user already typed — the domain picks
  // the IdP. Called on CLICK, not on blur: /start writes a one-shot state row
  // server-side, and probing per keystroke would mint junk rows.
  const onSso = async () => {
    setSsoHint(null)
    setProblem(null)
    const identifier = form.getValues('identifier').trim()
    const at = identifier.indexOf('@')
    if (at < 1 || at === identifier.length - 1) {
      setSsoHint('auth.ssoNeedEmail')
      return
    }
    setSsoBusy(true)
    try {
      const started = await ssoStart(identifier.slice(at + 1), search.redirect)
      if (!started) {
        setSsoHint('auth.ssoNoDomain')
        return
      }
      // Full navigation, not router.push: the authorize URL is the IdP's
      // origin, and the browser must carry the whole document there.
      window.location.assign(started.authorizeUrl)
    } catch (err) {
      setProblem(err)
    } finally {
      setSsoBusy(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setProblem(null)
    try {
      const result = await login(values.identifier, values.password)
      if (result.status === 'mfa_required') {
        setPendingChallenge(result.challengeToken ?? null)
        await navigate({ to: '/mfa', search: { redirect: search.redirect } })
        return
      }
      if (!result.tenantId) {
        await navigate({ to: '/onboarding' })
      } else if (search.redirect) {
        router.history.push(search.redirect)
      } else {
        await navigate({ to: '/' })
      }
    } catch (err) {
      setProblem(err)
    }
  })

  return (
    <AuthLayout>
      <AuthHeading title={t('auth.welcome')} description={t('auth.login.subtitle')} />

      {search.expired && (
        <Callout variant="info" className="-mt-2 mb-5">
          {t('auth.sessionExpired')}
        </Callout>
      )}

      {/* `noValidate`: the browser's own bubbles cannot be styled, are not
          translated with the rest of the page, and would pre-empt the
          messages below. */}
      <form className="space-y-5" noValidate onSubmit={(e) => void onSubmit(e)}>
        {problem !== null &&
          (problem instanceof NetworkError ? (
            <Callout variant="info">{t('errors.network')}</Callout>
          ) : (
            <Callout problem={problem} />
          ))}

        {/* The whole form is disabled while a request is in flight, so a second
            Enter cannot fire a second login. */}
        <fieldset disabled={busy} className="space-y-5">
          <Field
            id="identifier"
            label={t('auth.login.identifier')}
            error={errors.identifier?.message}
          >
            <Input
              id="identifier"
              autoComplete="username"
              autoFocus
              aria-invalid={errors.identifier ? true : undefined}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
              {...form.register('identifier')}
            />
          </Field>

          <Field
            id="password"
            label={t('auth.login.password')}
            error={errors.password?.message}
            action={
              <Link
                to="/forgot-password"
                className="rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t('auth.login.forgot')}
              </Link>
            }
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...form.register('password')}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? t('auth.login.signingIn') : t('auth.login.submit')}
          </Button>
        </fieldset>

        {/* Reserved positions (design-once, W23): passkey + SSO land HERE
            when their flags flip — nothing else moves. */}
        {(flags.authPasskeys || flags.authSso) && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t('auth.or')}
              <span className="h-px flex-1 bg-border" />
            </div>
            {flags.authPasskeys && (
              <Button type="button" variant="outline" className="w-full" disabled={busy}>
                <Fingerprint className="h-4 w-4" />
                {t('auth.passkey')}
              </Button>
            )}
            {flags.authSso && (
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={busy || ssoBusy}
                  onClick={() => void onSso()}
                >
                  {ssoBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {t('auth.sso')}
                </Button>
                {ssoHint && (
                  <p role="alert" className="text-xs text-muted-foreground">
                    {t(ssoHint)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link
          to="/register"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('auth.register.submit')}
        </Link>
      </p>

      {/* Stated once, quietly, and only what is true of any HTTPS page. */}
      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {t('auth.panel.secure')}
      </p>
    </AuthLayout>
  )
}

/**
 * Label, control, and an error that is actually announced.
 *
 * The message is tied to the input with `aria-describedby` and lives in a
 * `role="alert"` region, so a screen reader hears it when it appears rather
 * than only if the user happens to navigate back over the field.
 */
function Field({
  id,
  label,
  error,
  action,
  children,
}: {
  id: string
  label: string
  error?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {/* Zod carries the translation key; the component resolves it, so the
              schema stays free of rendering concerns. */}
          {t(error)}
        </p>
      )}
    </div>
  )
}
