import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

import { ssoComplete } from '@/lib/auth'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Callout } from '@/components/ui/callout'
import { Button } from '@/components/ui/button'

/**
 * W33 — where the IdP sends the browser back.
 *
 * This URL is registered verbatim at the identity provider, so it must stay
 * stable even if the login flow around it changes. The page itself does one
 * thing: post code+state to the API and adopt the session — the same
 * TokensResponse contract as a password login, which is why everything after
 * `ssoComplete` reads exactly like login.tsx.
 *
 * `error` in the query string is the IdP saying the user cancelled or the
 * request was refused (OAuth's error redirect). That is an outcome, not a
 * malfunction — it gets a calm message and a way back, not a red screen.
 */

const searchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

export const Route = createFileRoute('/sso/callback')({
  validateSearch: searchSchema,
  component: SsoCallbackPage,
})

function SsoCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [problem, setProblem] = useState<unknown>(null)
  const [denied, setDenied] = useState(false)

  // React 18/19 StrictMode mounts effects twice in dev. The state token is
  // single-use on the server, so the second POST would kill the first login —
  // the ref makes the exchange fire exactly once per page load.
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    if (search.error) {
      setDenied(true)
      return
    }
    if (!search.code || !search.state) {
      setProblem(new Error('missing code/state'))
      return
    }

    void (async () => {
      try {
        const result = await ssoComplete(search.state!, search.code!)
        if (!result.tenantId) {
          await navigate({ to: '/onboarding', replace: true })
        } else {
          await navigate({ to: '/', replace: true })
        }
      } catch (err) {
        setProblem(err)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once by design
  }, [])

  return (
    <AuthLayout>
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">
        {t('auth.ssoCallback.title')}
      </h1>

      {denied ? (
        <>
          <Callout variant="info" className="mt-5">
            {t('auth.ssoCallback.denied')}
          </Callout>
          <BackToLogin label={t('auth.ssoCallback.back')} />
        </>
      ) : problem !== null ? (
        <>
          <div className="mt-5">
            <Callout problem={problem} />
          </div>
          <BackToLogin label={t('auth.ssoCallback.retry')} />
        </>
      ) : (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t('auth.ssoCallback.working')}
        </p>
      )}
    </AuthLayout>
  )
}

function BackToLogin({ label }: { label: string }) {
  return (
    <Button asChild variant="outline" className="mt-6 w-full">
      <Link to="/login">{label}</Link>
    </Button>
  )
}
