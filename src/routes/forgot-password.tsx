import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { forgotPassword } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await forgotPassword(identifier)
    } finally {
      // Anti-enumeration: always show the same confirmation.
      setSent(true)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('forgot.title')}</CardTitle>
          <CardDescription>{t('forgot.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('forgot.sent')}</p>
              <Button asChild className="w-full">
                <Link to="/reset-password" search={{ token: undefined }}>
                  {t('forgot.haveToken')}
                </Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="id">{t('auth.login.identifier')}</Label>
                <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !identifier}>
                {busy ? t('app.loading') : t('forgot.submit')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" search={{ redirect: undefined }} className="underline">
                  {t('forgot.backToLogin')}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
