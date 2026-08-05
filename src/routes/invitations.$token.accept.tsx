import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { acceptInvitation } from '@/lib/api/queries'
import { setAccessToken, setCurrentTenantId } from '@/lib/api/http'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

// PUBLIC invitation acceptance. New users set a name + password here; existing
// users just accept (their password is ignored server-side).
export const Route = createFileRoute('/invitations/$token/accept')({
  component: AcceptInvitePage,
})

function AcceptInvitePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = Route.useParams()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onAccept(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await acceptInvitation(token, {
        name: name.trim() || undefined,
        password: password || undefined,
      })
      if (r.access_token) {
        setAccessToken(r.access_token)
        setCurrentTenantId(r.tenant_id ?? null)
        toast.success(t('invite.accepted'))
        await navigate({ to: '/' })
      } else {
        toast.success(t('invite.accepted'))
        await navigate({ to: '/login', search: { redirect: undefined } })
      }
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem)
        toast.error(err.status === 404 ? t('invite.invalid') : (err.detail ?? t('errors.unknown')))
      else toast.error(t('errors.unknown'))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5" />
            {t('invite.title')}
          </CardTitle>
          <CardDescription>{t('invite.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onAccept(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('settings.name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">{t('auth.login.password')}</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('invite.passwordHint')}</p>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t('app.loading') : t('invite.accept')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
