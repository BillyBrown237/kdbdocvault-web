import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { resetPassword } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await resetPassword(token, password)
      toast.success(t('reset.done'))
      await navigate({ to: '/login', search: { redirect: undefined } })
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? t('reset.invalid'))
      else toast.error(t('errors.unknown'))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('reset.title')}</CardTitle>
          <CardDescription>{t('reset.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="token">{t('reset.token')}</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">{t('reset.newPassword')}</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !token || password.length < 10}>
              {busy ? t('app.loading') : t('reset.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
