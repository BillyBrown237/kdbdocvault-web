import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Fingerprint } from 'lucide-react'
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
const formSchema = z.object({ identifier: z.string().min(1), password: z.string().min(1) })
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
  })

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
      <h1 className="text-2xl font-semibold tracking-tight">{t('auth.welcome')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('auth.login.title')}</p>

      {search.expired && (
        <Callout variant="info" className="mt-4">
          {t('auth.sessionExpired')}
        </Callout>
      )}

      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        {problem !== null &&
          (problem instanceof NetworkError ? (
            <Callout variant="info">{t('errors.network')}</Callout>
          ) : (
            <Callout problem={problem} />
          ))}

        <div className="space-y-1.5">
          <Label htmlFor="identifier">{t('auth.login.identifier')}</Label>
          <Input id="identifier" autoComplete="username" {...form.register('identifier')} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground underline">
              {t('auth.login.forgot')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('app.loading') : t('auth.login.submit')}
        </Button>

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
              <Button type="button" variant="outline" className="w-full">
                <Fingerprint className="h-4 w-4" />
                {t('auth.passkey')}
              </Button>
            )}
            {flags.authSso && (
              <Button type="button" variant="outline" className="w-full">
                {t('auth.sso')}
              </Button>
            )}
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-medium text-foreground underline">
            {t('auth.register.submit')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
