import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Fingerprint, Loader2, Lock } from 'lucide-react'
import { z } from 'zod'

import { login, setPendingChallenge } from '@/lib/auth'
import { NetworkError } from '@/lib/api/http'
import { flags } from '@/lib/flags'
import { AuthLayout } from '@/components/auth/auth-layout'
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '', password: '' },
    // Errors appear when a field is left, not on every keystroke — nothing is
    // marked wrong before there was a chance to finish it.
    mode: 'onBlur',
  })

  const busy = form.formState.isSubmitting
  const errors = form.formState.errors

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
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-white">
        {t('auth.welcome')}
      </h1>
      <p className="mt-2 text-sm text-slate-400">{t('auth.login.subtitle')}</p>

      {search.expired && (
        <Callout variant="info" className="mt-5">
          {t('auth.sessionExpired')}
        </Callout>
      )}

      {/* `noValidate`: the browser's own bubbles cannot be styled, are not
          translated with the rest of the page, and would pre-empt the
          messages below. */}
      <form className="mt-7 space-y-5" noValidate onSubmit={(e) => void onSubmit(e)}>
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
                className="rounded-sm text-xs text-slate-400 underline-offset-4 transition-colors hover:text-slate-200 hover:underline"
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
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/[0.08]" />
              {t('auth.or')}
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>
            {flags.authPasskeys && (
              <Button type="button" variant="outline" className="w-full" disabled={busy}>
                <Fingerprint className="h-4 w-4" />
                {t('auth.passkey')}
              </Button>
            )}
            {flags.authSso && (
              <Button type="button" variant="outline" className="w-full" disabled={busy}>
                {t('auth.sso')}
              </Button>
            )}
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        {t('auth.login.noAccount')}{' '}
        <Link
          to="/register"
          className="rounded-sm font-medium text-white underline-offset-4 hover:underline"
        >
          {t('auth.register.submit')}
        </Link>
      </p>

      {/* Stated once, quietly, and only what is true of any HTTPS page. */}
      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
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
        <Label htmlFor={id} className="text-slate-300">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-amber-400">
          {/* Zod carries the translation key; the component resolves it, so the
              schema stays free of rendering concerns. */}
          {t(error)}
        </p>
      )}
    </div>
  )
}
