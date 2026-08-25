import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

import { verifyDocumentHash } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { PublicShell } from '@/components/public-shell'
import { Skeleton } from '@/components/ui/skeleton'

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
    <PublicShell>
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-lg font-semibold">{t('verify.title')}</h1>

          {result.isPending ? (
            <div className="mt-6 space-y-3" role="status" aria-live="polite">
              <Skeleton className="mx-auto size-14 rounded-full" />
              <Skeleton className="mx-auto h-4 w-40" />
              <span className="sr-only">{t('app.loading')}</span>
            </div>
          ) : result.isError || !valid ? (
            // The verdict is carried by the icon, the colour AND the sentence.
            // Someone checking whether a document is genuine should not have
            // to depend on being able to tell red from green.
            <div className="mt-6 space-y-3">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-destructive">
                <ShieldAlert className="size-7" />
              </span>
              <p className="font-medium text-red-700">{t('verify.invalid')}</p>
              <p className="text-muted-foreground text-sm">{t('verify.invalidHint')}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <ShieldCheck className="size-7" />
              </span>
              <p className="font-medium text-emerald-700">{t('verify.valid')}</p>
              <dl className="space-y-1.5 border-t pt-4 text-sm">
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

          {/* The hash the visitor pasted, echoed back so they can confirm this
              page is answering about the document they actually have. */}
          <p className="text-muted-foreground bg-muted/50 mt-6 rounded-md px-3 py-2 font-mono text-[10px] break-all">
            {documentHash}
          </p>
        </CardContent>
      </Card>
    </PublicShell>
  )
}
