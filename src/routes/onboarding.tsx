import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { createTenant, meQuery, plansQuery, switchTenant } from '@/lib/api/queries'
import { hasTenant } from '@/lib/auth'
import { requireAuth } from '@/lib/route-guards'
import { queryClient } from '@/lib/query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ location, context }) => {
    await requireAuth(location)
    if (hasTenant()) throw redirect({ to: '/' })
    // Stale tenant-less session but an existing membership (e.g. tenant was
    // created from another device/client): don't show "create your org" —
    // switch into it and move on.
    const me = await context.queryClient.fetchQuery(meQuery)
    const existing = me.memberships[0]
    if (existing) {
      await switchTenant(context.queryClient, existing.tenant_id)
      throw redirect({ to: '/' })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const plans = useQuery(plansQuery)

  const [name, setName] = useState('')
  const [planId, setPlanId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const selectedPlan = planId ?? plans.data?.data[0]?.id ?? null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !selectedPlan) return
    setSubmitting(true)
    setServerError(null)
    try {
      const tenant = await createTenant({ name: name.trim(), plan: selectedPlan, region: 'CM' })
      await switchTenant(queryClient, tenant.id)
      await router.invalidate()
      await navigate({ to: '/' })
    } catch (err) {
      if (err instanceof NetworkError) setServerError(t('errors.network'))
      else if (err instanceof ApiProblem) setServerError(err.detail ?? t('errors.unknown'))
      else setServerError(t('errors.unknown'))
      setSubmitting(false)
    }
  }

  const priceLabel = (minor: number, currency: string, interval: string) =>
    `${new Intl.NumberFormat(i18n.language).format(minor)} ${currency} / ${t(`onboarding.interval.${interval}`)}`

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">{t('onboarding.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('onboarding.subtitle')}</p>

        <form className="mt-6 space-y-5" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label className="block text-sm font-medium" htmlFor="org-name">
              {t('onboarding.orgName')}
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder={t('onboarding.orgNamePlaceholder')}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">{t('onboarding.plan')}</div>
            {plans.isPending ? (
              <p className="text-sm text-slate-500">{t('app.loading')}</p>
            ) : (
              <div className="space-y-2">
                {plans.data?.data.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left text-sm',
                      selectedPlan === p.id
                        ? 'border-slate-900 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-400',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-slate-500">
                        {priceLabel(p.price_minor_units, p.currency, p.billing_interval)}
                      </span>
                    </div>
                    {p.features && (
                      <div className="mt-1 text-xs text-slate-500">{p.features.join(' · ')}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">{t('onboarding.trialNote')}</p>
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !selectedPlan}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? t('app.loading') : t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
