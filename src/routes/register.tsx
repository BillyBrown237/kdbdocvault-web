import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { login, register, verifyIdentifier } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

const formSchema = z.object({ email: z.string().email(), password: z.string().min(10) })
const codeSchema = z.object({ code: z.string().min(4) })
type FormValues = z.infer<typeof formSchema>
type CodeValues = z.infer<typeof codeSchema>

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [credentials, setCredentials] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem) toast.error(err.detail ?? t('errors.unknown'))
    else toast.error(t('errors.unknown'))
  }

  const onRegister = form.handleSubmit(async (values) => {
    try {
      await register(values.email, values.password, i18n.language.startsWith('en') ? 'en' : 'fr')
      setCredentials(values)
      setStep('code')
      toast.success(t('auth.register.codeSent', { email: values.email }))
    } catch (err) {
      fail(err)
    }
  })

  const onVerify = codeForm.handleSubmit(async (values) => {
    if (!credentials) return
    try {
      await verifyIdentifier(credentials.email, values.code)
      const result = await login(credentials.email, credentials.password)
      await navigate({ to: result.tenantId ? '/' : '/onboarding' })
    } catch (err) {
      fail(err)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('app.name')}</CardTitle>
          <CardDescription>
            {step === 'form' ? t('auth.register.title') : t('auth.register.verifyTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'form' ? (
            <form className="space-y-4" onSubmit={(e) => void onRegister(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.register.email')}</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('password')}
                />
                <p className="text-xs text-muted-foreground">{t('auth.register.passwordHint')}</p>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('app.loading') : t('auth.register.submit')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.register.haveAccount')}{' '}
                <Link
                  to="/login"
                  search={{ redirect: undefined }}
                  className="font-medium text-foreground underline"
                >
                  {t('auth.login.submit')}
                </Link>
              </p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void onVerify(e)}>
              <p className="text-sm text-muted-foreground">
                {t('auth.register.codeSent', { email: credentials?.email ?? '' })}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="code">{t('auth.register.code')}</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...codeForm.register('code')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={codeForm.formState.isSubmitting}>
                {codeForm.formState.isSubmitting ? t('app.loading') : t('auth.register.verify')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
