import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, PenLine, ShieldCheck, XCircle } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import {
  guestDecline,
  guestRequestOtp,
  guestSign,
  guestSignView,
  guestSubmitOtp,
} from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'

// PUBLIC guest-signing surface — no auth guard. Token in the path is the credential.
export const Route = createFileRoute('/sign/$signToken')({ component: SignPage })

type Phase = 'view' | 'otp' | 'done'

function SignPage() {
  const { t } = useTranslation()
  const { signToken } = Route.useParams()

  const view = useQuery({
    queryKey: ['sign', signToken],
    queryFn: () => guestSignView(signToken),
    retry: false,
  })

  const [phase, setPhase] = useState<Phase>('view')
  const [verified, setVerified] = useState(false)
  const [code, setCode] = useState('')
  const [typedName, setTypedName] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<'signed' | 'declined' | null>(null)

  const fail = (err: unknown) => {
    if (err instanceof NetworkError) toast.error(t('errors.network'))
    else if (err instanceof ApiProblem)
      toast.error(err.status === 404 ? t('shared.notFound') : (err.detail ?? t('errors.unknown')))
    else toast.error(t('errors.unknown'))
  }

  async function requestOtp() {
    setBusy(true)
    try {
      await guestRequestOtp(signToken)
      setPhase('otp')
      toast.success(t('signGuest.codeSent'))
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await guestSubmitOtp(signToken, code)
      setVerified(true)
      setPhase('view')
      toast.success(t('signGuest.verified'))
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function doSign() {
    if (!typedName.trim() || !consent) return
    setBusy(true)
    try {
      await guestSign(signToken, { type: 'typed', data: typedName.trim() }, consent)
      setOutcome('signed')
      setPhase('done')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function doDecline() {
    setBusy(true)
    try {
      await guestDecline(signToken, t('signGuest.declinedReason'))
      setOutcome('declined')
      setPhase('done')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const meta = view.data
  const needsVerify = meta?.verify_required && !verified

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <p className="text-center text-sm font-medium text-muted-foreground">{t('app.name')}</p>

          {view.isPending ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">{t('app.loading')}</p>
          ) : view.isError || !meta ? (
            <p className="mt-6 text-center text-sm text-red-600">{t('shared.notFound')}</p>
          ) : phase === 'done' ? (
            <div className="mt-6 text-center">
              {outcome === 'signed' ? (
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              ) : (
                <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              )}
              <p className="mt-3 font-medium">
                {outcome === 'signed' ? t('signGuest.signedThanks') : t('signGuest.declinedDone')}
              </p>
            </div>
          ) : (
            <>
              <PenLine className="mx-auto mt-6 h-10 w-10 text-muted-foreground" />
              <h1 className="mt-3 text-center text-lg font-bold break-words">
                {meta.envelope.document_title}
              </h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {t('signGuest.hello', { name: meta.signer.name })}
              </p>
              {meta.envelope.message && (
                <p className="mt-3 rounded-md bg-muted p-3 text-sm">{meta.envelope.message}</p>
              )}

              {phase === 'otp' ? (
                <form className="mt-6 space-y-3" onSubmit={(e) => void submitOtp(e)}>
                  <Label htmlFor="otp">{t('signGuest.enterCode')}</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button type="submit" className="w-full" disabled={busy || !code}>
                    {busy ? t('app.loading') : t('signGuest.verify')}
                  </Button>
                </form>
              ) : needsVerify ? (
                <div className="mt-6 text-center">
                  <p className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    {t('signGuest.verifyFirst')}
                  </p>
                  <Button onClick={() => void requestOtp()} disabled={busy}>
                    {busy ? t('app.loading') : t('signGuest.sendCode')}
                  </Button>
                </div>
              ) : !meta.is_your_turn ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t('signGuest.notYourTurn')}
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="typed">{t('signGuest.typeName')}</Label>
                    <Input
                      id="typed"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder={meta.signer.name}
                      className="font-[cursive] text-lg"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    {t('signGuest.consent')}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={busy || !typedName.trim() || !consent}
                      onClick={() => void doSign()}
                    >
                      {busy ? t('app.loading') : t('signGuest.sign')}
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => void doDecline()}>
                      {t('signGuest.decline')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
