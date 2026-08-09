import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { NetworkError } from '@/lib/api/http'
import { login, register, verifyIdentifier } from '@/lib/auth'
import { AuthLayout } from '@/components/auth/auth-layout'
import { OtpInput } from '@/components/auth/otp-input'
import { PasswordInput, StrengthMeter } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const formSchema = z.object({ email: z.string().email(), password: z.string().min(10) })
type FormValues = z.infer<typeof formSchema>

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [credentials, setCredentials] = useState<FormValues | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [problem, setProblem] = useState<unknown>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })
  const password = form.watch('password')

  const onRegister = form.handleSubmit(async (values) => {
    setProblem(null)
    try {
      await register(values.email, values.password, i18n.language.startsWith('en') ? 'en' : 'fr')
      setCredentials(values)
      setStep('code')
    } catch (err) {
      setProblem(err)
    }
  })

  async function onVerify(value: string) {
    if (!credentials || verifying || value.length !== 6) return
    setVerifying(true)
    setProblem(null)
    try {
      await verifyIdentifier(credentials.email, value)
      const result = await login(credentials.email, credentials.password)
      await navigate({ to: result.tenantId ? '/' : '/onboarding' })
    } catch (err) {
      setProblem(err)
      setCode('')
      setVerifying(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">
        {step === 'form' ? t('auth.register.title') : t('auth.register.verifyTitle')}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === 'form'
          ? t('auth.register.subtitle')
          : t('auth.register.codeSent', { email: credentials?.email ?? '' })}
      </p>

      {step === 'form' ? (
        <form className="mt-6 space-y-4" onSubmit={(e) => void onRegister(e)}>
          {problem !== null &&
            (problem instanceof NetworkError ? (
              <Callout variant="info">{t('errors.network')}</Callout>
            ) : (
              <Callout problem={problem} />
            ))}

          <div className="space-y-1.5">
            <Label htmlFor="email">{t('auth.register.email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            <StrengthMeter value={password} />
            <p className="text-xs text-muted-foreground">{t('auth.register.passwordHint')}</p>
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('app.loading') : t('auth.register.submit')}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('auth.register.consent')}
          </p>
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
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onVerify(code)
          }}
        >
          {problem !== null &&
            (problem instanceof NetworkError ? (
              <Callout variant="info">{t('errors.network')}</Callout>
            ) : (
              <Callout problem={problem} />
            ))}

          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(v) => void onVerify(v)}
            autoFocus
            disabled={verifying}
            error={problem !== null && !(problem instanceof NetworkError)}
          />

          <Button type="submit" className="w-full" disabled={verifying || code.length !== 6}>
            {verifying ? t('app.loading') : t('auth.register.verify')}
          </Button>

          {/* "Wrong address?" escape hatch — back to the form, values kept. */}
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="underline"
              onClick={() => {
                setStep('form')
                setProblem(null)
                setCode('')
              }}
            >
              {t('auth.register.wrongEmail')}
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
