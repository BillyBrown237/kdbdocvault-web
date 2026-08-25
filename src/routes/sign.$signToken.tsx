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
import { Skeleton } from '@/components/ui/skeleton'
import { PublicShell } from '@/components/public-shell'
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
    <PublicShell>
      <Card>
        <CardContent className="p-8">
          {view.isPending ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <Skeleton className="mx-auto size-14 rounded-full" />
              <Skeleton className="mx-auto h-5 w-56" />
              <Skeleton className="mx-auto h-4 w-32" />
              <span className="sr-only">{t('app.loading')}</span>
            </div>
          ) : view.isError || !meta ? (
            <p className="text-center text-sm text-destructive">{t('shared.notFound')}</p>
          ) : phase === 'done' ? (
            <div className="text-center">
              {/* Icon, colour AND sentence: this is the screen that tells
                  someone whether they have signed a document, and it must not
                  rely on being able to tell green from grey. */}
              {outcome === 'signed' ? (
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-7" />
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground mx-auto grid size-14 place-items-center rounded-full">
                  <XCircle className="size-7" />
                </span>
              )}
              <p className="mt-4 font-medium">
                {outcome === 'signed' ? t('signGuest.signedThanks') : t('signGuest.declinedDone')}
              </p>
            </div>
          ) : (
            <>
              <span className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-xl">
                <PenLine className="size-6" />
              </span>
              <h1 className="mt-4 text-center text-lg font-semibold break-words">
                {meta.envelope.document_title}
              </h1>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                {t('signGuest.hello', { name: meta.signer.name })}
              </p>
              {meta.envelope.message && (
                // A quoted note from a person, marked as theirs rather than as
                // app chrome — the border says "someone wrote this to you".
                <blockquote className="border-primary/40 bg-muted/60 mt-4 border-l-2 py-2 pl-3 text-sm">
                  {meta.envelope.message}
                </blockquote>
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
                    {/* Taller, centred, and on a tinted panel: this is the one
                        field on the page that stands for the person's name on
                        a document, and a 36px input treats it like a search
                        box. */}
                    <Input
                      id="typed"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder={meta.signer.name}
                      autoComplete="off"
                      className="bg-muted/40 h-16 text-center font-[cursive] text-2xl"
                    />
                  </div>
                  {/* The consent text is the legally meaningful part, so it is
                      foreground-coloured, not muted — and `accent-color` makes
                      the native checkbox brand blue without replacing it with
                      a custom control a password manager cannot see. */}
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="accent-primary mt-0.5 size-4 shrink-0 cursor-pointer"
                    />
                    <span className="text-muted-foreground">{t('signGuest.consent')}</span>
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
    </PublicShell>
  )
}
