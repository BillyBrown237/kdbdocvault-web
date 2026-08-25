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
import { AuthHeading, AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ location, context }) => {
    await requireAuth(location)
    if (hasTenant()) throw redirect({ to: '/' })
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

  const selectedPlan = planId ?? plans.data?.data[0]?.id ?? null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !selectedPlan) return
    setSubmitting(true)
    try {
      const tenant = await createTenant({
        name: name.trim(),
        plan: selectedPlan,
        region: 'CM',
      })
      await switchTenant(queryClient, tenant.id)
      await router.invalidate()
      await navigate({ to: '/' })
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? t('errors.unknown'))
      else toast.error(t('errors.unknown'))
      setSubmitting(false)
    }
  }

  const priceLabel = (minor: number, currency: string, interval: string) =>
    `${new Intl.NumberFormat(i18n.language).format(minor)} ${currency} / ${t(`onboarding.interval.${interval}`)}`

  return (
    <AuthLayout>
      {/* Was a <Card className="border-0 shadow-none"> — a card asked not to
          look like a card. The other five auth screens use AuthHeading, and
          this one is the first thing a new account sees. */}
      <AuthHeading title={t('onboarding.title')} description={t('onboarding.subtitle')} />
      <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-1.5">
          <Label htmlFor="org-name">{t('onboarding.orgName')}</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('onboarding.orgNamePlaceholder')}
            autoFocus
          />
        </div>

        <div>
          <Label className="mb-2 block" id="plan-label">
            {t('onboarding.plan')}
          </Label>
          {plans.isPending ? (
            <div className="space-y-2" role="status" aria-live="polite">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.25rem] rounded-lg" />
              ))}
              <span className="sr-only">{t('app.loading')}</span>
            </div>
          ) : (
            // A radiogroup, not a row of buttons. Picking one of these
            // deselects the others, which is what a radio IS — and as
            // plain buttons a screen reader announced three unrelated
            // controls with no indication that any was chosen, and arrow
            // keys did nothing.
            <div className="space-y-2" role="radiogroup" aria-labelledby="plan-label">
              {plans.data?.data.map((p) => {
                const checked = selectedPlan === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'focus-visible:ring-ring w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      checked
                        ? 'border-primary bg-primary/5 ring-primary ring-1'
                        : 'hover:border-ring/50 hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        {/* The chosen plan is marked by a shape as well as
                                a border tint — a 1px ring is easy to miss. */}
                        <span
                          aria-hidden
                          className={cn(
                            'grid size-4 shrink-0 place-items-center rounded-full border',
                            checked ? 'border-primary bg-primary' : 'border-input',
                          )}
                        >
                          {checked && (
                            <span className="bg-primary-foreground size-1.5 rounded-full" />
                          )}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="text-muted-foreground tabular shrink-0">
                        {priceLabel(p.price_minor_units, p.currency, p.billing_interval)}
                      </span>
                    </div>
                    {p.features && (
                      <div className="text-muted-foreground mt-1.5 pl-6 text-xs">
                        {p.features.join(' · ')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t('onboarding.trialNote')}</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !name.trim() || !selectedPlan}
        >
          {submitting ? t('app.loading') : t('onboarding.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
