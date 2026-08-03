import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { login } from '@/lib/auth'
import { ApiProblem, NetworkError } from '@/lib/api/http'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

const formSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      const result = await login(values.identifier, values.password)
      if (result.status === 'mfa_required') {
        // MFA screen comes in a later slice — surface the state honestly for now.
        setServerError(t('auth.login.mfaRequired'))
        return
      }
      if (search.redirect) {
        router.history.push(search.redirect)
      } else {
        await navigate({ to: '/' })
      }
    } catch (err) {
      if (err instanceof NetworkError) setServerError(t('errors.network'))
      else if (err instanceof ApiProblem) setServerError(t('auth.login.error'))
      else setServerError(t('errors.unknown'))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">{t('app.name')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.login.title')}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label className="block text-sm font-medium" htmlFor="identifier">
              {t('auth.login.identifier')}
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              {...form.register('identifier')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="password">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              {...form.register('password')}
            />
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {form.formState.isSubmitting ? t('app.loading') : t('auth.login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
