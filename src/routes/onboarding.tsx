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
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      const tenant = await createTenant({ name: name.trim(), plan: selectedPlan, region: 'CM' })
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
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl">{t('onboarding.title')}</CardTitle>
          <CardDescription>{t('onboarding.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="org-name">{t('onboarding.orgName')}</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.orgNamePlaceholder')}
              />
            </div>

            <div>
              <Label className="mb-2 block">{t('onboarding.plan')}</Label>
              {plans.isPending ? (
                <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
              ) : (
                <div className="space-y-2">
                  {plans.data?.data.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={cn(
                        'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                        selectedPlan === p.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'hover:border-muted-foreground/40',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">
                          {priceLabel(p.price_minor_units, p.currency, p.billing_interval)}
                        </span>
                      </div>
                      {p.features && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {p.features.join(' · ')}
                        </div>
                      )}
                    </button>
                  ))}
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
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
