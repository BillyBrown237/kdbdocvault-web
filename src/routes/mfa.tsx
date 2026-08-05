import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { completeMfa, getPendingChallenge } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/mfa')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: () => {
    // No live challenge (e.g. refreshed the page) → back to login.
    if (!getPendingChallenge()) throw redirect({ to: '/login', search: { redirect: undefined } })
  },
  component: MfaPage,
})

function MfaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const search = Route.useSearch()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const { tenantId } = await completeMfa({ totp_code: code })
      if (!tenantId) await navigate({ to: '/onboarding' })
      else if (search.redirect) router.history.push(search.redirect)
      else await navigate({ to: '/' })
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(t('mfa.invalid'))
      else toast.error(t('errors.unknown'))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('mfa.title')}</CardTitle>
          <CardDescription>{t('mfa.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="code">{t('mfa.code')}</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !code}>
              {busy ? t('app.loading') : t('mfa.verify')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
