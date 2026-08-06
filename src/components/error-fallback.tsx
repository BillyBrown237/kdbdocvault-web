import { Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, FileQuestion } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { Button } from '@/components/ui/button'

/**
 * Router-level error boundary (defaultErrorComponent). Honest about what
 * happened: ApiProblem details are shown as-is (they are already user-facing
 * problem+json), NetworkError maps to the offline message, anything else is
 * "something went wrong" — with the raw message visible only in dev.
 */
export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()

  const detail =
    error instanceof ApiProblem
      ? (error.detail ?? error.title)
      : error instanceof NetworkError
        ? t('errors.network')
        : t('errors.unknown')

  function retry() {
    reset()
    void router.invalidate()
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <div>
        <h1 className="text-lg font-semibold">{t('errors.title')}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>
        {import.meta.env.DEV && !(error instanceof ApiProblem) && (
          <pre className="mt-3 max-w-md overflow-x-auto rounded bg-muted p-2 text-left text-xs">
            {error.stack ?? error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={retry}>{t('common.retry')}</Button>
        <Button variant="outline" asChild>
          <Link to="/">{t('errors.goHome')}</Link>
        </Button>
      </div>
    </div>
  )
}

/** Router-level 404 (defaultNotFoundComponent). */
export function NotFoundFallback() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">{t('errors.notFoundTitle')}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('errors.notFoundBody')}</p>
      </div>
      <Button asChild>
        <Link to="/">{t('errors.goHome')}</Link>
      </Button>
    </div>
  )
}
