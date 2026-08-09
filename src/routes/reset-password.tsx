import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { NetworkError } from '@/lib/api/http'
import { resetPassword } from '@/lib/api/queries'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput, StrengthMeter } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [token, setToken] = useState(search.token ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<unknown>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    try {
      await resetPassword(token, password)
      // Success lands on login with a chip, not a dead-end "done" page.
      toast.success(t('reset.done'))
      await navigate({ to: '/login', search: { redirect: undefined } })
    } catch (err) {
      setProblem(err)
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">{t('reset.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('reset.subtitle')}</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        {problem !== null &&
          (problem instanceof NetworkError ? (
            <Callout variant="info">{t('errors.network')}</Callout>
          ) : (
            <Callout problem={problem}>{t('reset.invalid')}</Callout>
          ))}

        <div className="space-y-1.5">
          <Label htmlFor="token">{t('reset.token')}</Label>
          <Input
            id="token"
            className="font-mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t('reset.newPassword')}</Label>
          <PasswordInput
            id="pw"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthMeter value={password} />
        </div>
        <Button type="submit" className="w-full" disabled={busy || !token || password.length < 10}>
          {busy ? t('app.loading') : t('reset.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
