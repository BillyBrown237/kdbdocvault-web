import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

import { verifyDocumentHash } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

// PUBLIC integrity check — the target of the QR code stamped on sealed PDFs.
// Unversioned by design (a printed seal must resolve for the document's life).
export const Route = createFileRoute('/verify/$documentHash')({
  component: VerifyPage,
})

function VerifyPage() {
  const { t, i18n } = useTranslation()
  const { documentHash } = Route.useParams()

  const result = useQuery({
    queryKey: ['verify', documentHash],
    queryFn: () => verifyDocumentHash(documentHash),
    retry: false,
  })

  const valid = result.data?.valid

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">{t('app.name')}</p>
          <h1 className="mt-1 text-lg font-bold">{t('verify.title')}</h1>

          {result.isPending ? (
            <p className="mt-6 text-sm text-muted-foreground">{t('app.loading')}</p>
          ) : result.isError || !valid ? (
            <div className="mt-6 space-y-3">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{t('verify.invalid')}</p>
              <p className="text-sm text-muted-foreground">{t('verify.invalidHint')}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="font-medium text-emerald-700">{t('verify.valid')}</p>
              <dl className="space-y-1 text-sm">
                {result.data.issuer && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('verify.issuer')}</dt>
                    <dd className="font-medium">{result.data.issuer}</dd>
                  </div>
                )}
                {result.data.sealed_at && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('verify.sealedAt')}</dt>
                    <dd className="font-medium">
                      {formatDate(result.data.sealed_at, i18n.language)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <p className="mt-6 break-all font-mono text-[10px] text-muted-foreground">
            {documentHash}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
