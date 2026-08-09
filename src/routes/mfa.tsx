import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { NetworkError } from '@/lib/api/http'
import { completeMfa, getPendingChallenge } from '@/lib/auth'
import { flags } from '@/lib/flags'
import { AuthLayout } from '@/components/auth/auth-layout'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'

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
  const [problem, setProblem] = useState<unknown>(null)

  async function submit(value: string) {
    if (busy || value.length !== 6) return
    setBusy(true)
    setProblem(null)
    try {
      const { tenantId } = await completeMfa({ totp_code: value })
      if (!tenantId) await navigate({ to: '/onboarding' })
      else if (search.redirect) router.history.push(search.redirect)
      else await navigate({ to: '/' })
    } catch (err) {
      setProblem(err)
      setCode('')
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">{t('mfa.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('mfa.totpHint')}</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit(code)
        }}
      >
        {problem !== null &&
          (problem instanceof NetworkError ? (
            <Callout variant="info">{t('errors.network')}</Callout>
          ) : (
            <Callout problem={problem}>{t('mfa.invalid')}</Callout>
          ))}

        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(v) => void submit(v)}
          autoFocus
          disabled={busy}
          error={problem !== null && !(problem instanceof NetworkError)}
        />

        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? t('app.loading') : t('mfa.verify')}
        </Button>

        {/* Reserved method switcher (design-once): SMS / passkey variants. */}
        {(flags.authSms || flags.authPasskeys) && (
          <p className="text-center text-xs text-muted-foreground">
            {flags.authSms && (
              <button type="button" className="underline">
                {t('mfa.useSms')}
              </button>
            )}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <a href="mailto:support@kdbvault.com" className="underline">
            {t('mfa.lostDevice')}
          </a>
        </p>
      </form>
    </AuthLayout>
  )
}
