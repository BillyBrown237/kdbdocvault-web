import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { login, register, verifyIdentifier } from '@/lib/auth'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
})
const codeSchema = z.object({ code: z.string().min(4) })

type FormValues = z.infer<typeof formSchema>
type CodeValues = z.infer<typeof codeSchema>

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [credentials, setCredentials] = useState<FormValues | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) setServerError(t('errors.network'))
    else if (err instanceof ApiProblem) setServerError(err.detail ?? t('errors.unknown'))
    else setServerError(t('errors.unknown'))
  }

  const onRegister = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      await register(values.email, values.password, i18n.language.startsWith('en') ? 'en' : 'fr')
      setCredentials(values)
      setStep('code')
    } catch (err) {
      fail(err)
    }
  })

  const onVerify = codeForm.handleSubmit(async (values) => {
    if (!credentials) return
    setServerError(null)
    try {
      await verifyIdentifier(credentials.email, values.code)
      const result = await login(credentials.email, credentials.password)
      await navigate({ to: result.tenantId ? '/' : '/onboarding' })
    } catch (err) {
      fail(err)
    }
  })

  const inputCls =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none'
  const buttonCls =
    'w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">{t('app.name')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 'form' ? t('auth.register.title') : t('auth.register.verifyTitle')}
        </p>

        {step === 'form' ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onRegister(e)}>
            <div>
              <label className="block text-sm font-medium" htmlFor="email">
                {t('auth.register.email')}
              </label>
              <input id="email" type="email" autoComplete="email" className={inputCls} {...form.register('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="password">
                {t('auth.login.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={inputCls}
                {...form.register('password')}
              />
              <p className="mt-1 text-xs text-slate-400">{t('auth.register.passwordHint')}</p>
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <button type="submit" disabled={form.formState.isSubmitting} className={buttonCls}>
              {form.formState.isSubmitting ? t('app.loading') : t('auth.register.submit')}
            </button>
            <p className="text-center text-sm text-slate-500">
              {t('auth.register.haveAccount')}{' '}
              <Link to="/login" search={{ redirect: undefined }} className="font-medium text-slate-900 underline">
                {t('auth.login.submit')}
              </Link>
            </p>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onVerify(e)}>
            <p className="text-sm text-slate-600">
              {t('auth.register.codeSent', { email: credentials?.email ?? '' })}
            </p>
            <div>
              <label className="block text-sm font-medium" htmlFor="code">
                {t('auth.register.code')}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={inputCls}
                {...codeForm.register('code')}
              />
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <button type="submit" disabled={codeForm.formState.isSubmitting} className={buttonCls}>
              {codeForm.formState.isSubmitting ? t('app.loading') : t('auth.register.verify')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
