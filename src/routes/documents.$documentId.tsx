import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Download, Star } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { DocumentActions } from '@/components/document-actions'
import { SharePanel } from '@/components/share-panel'
import { SignaturePanel } from '@/components/signature-panel'
import { LifecyclePanel } from '@/components/lifecycle-panel'
import {
  addFavorite,
  documentQuery,
  documentVersionsQuery,
  downloadDocumentBlob,
  favoritesQuery,
  removeFavorite,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { formatBytes, formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

export const Route = createFileRoute('/documents/$documentId')({
  beforeLoad: ({ location }) => requireTenant(location),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(documentQuery(params.documentId)),
  component: DocumentDetail,
})

function DocumentDetail() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { documentId } = Route.useParams()

  const doc = useQuery(documentQuery(documentId))
  const versions = useQuery(documentVersionsQuery(documentId))
  const favorites = useQuery(favoritesQuery)
  const [downloading, setDownloading] = useState(false)

  const isFavorite = favorites.data?.data.some((d) => d.id === documentId) ?? false

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(documentId) : addFavorite(documentId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  async function onDownload() {
    if (!doc.data) return
    setDownloading(true)
    try {
      const blob = await downloadDocumentBlob(documentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.data.title
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (err instanceof NetworkError) toast.error(t('errors.network'))
      else if (err instanceof ApiProblem) toast.error(err.detail ?? err.title)
      else toast.error(t('errors.unknown'))
    } finally {
      setDownloading(false)
    }
  }

  const d = doc.data
  const version = d?.current_version

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.history.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
          {d?.title ?? t('app.loading')}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => favoriteMutation.mutate()}
          disabled={favoriteMutation.isPending}
          aria-label={t('document.favorite')}
        >
          <Star
            className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}
          />
        </Button>
        <Button onClick={() => void onDownload()} disabled={downloading || !d}>
          <Download className="h-4 w-4" />
          {downloading ? t('app.loading') : t('document.download')}
        </Button>
      </div>

      {d && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">{t('document.details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t('document.detailStatus')}</dt>
                  <dd>
                    <Badge variant="secondary">{t(`document.status.${d.status}`)}</Badge>
                  </dd>
                </div>
                {version && (
                  <>
                    <Row label={t('document.size')} value={formatBytes(version.size_bytes, i18n.language)} />
                    <Row label={t('document.mime')} value={version.mime_type} />
                  </>
                )}
                <Row label={t('document.updated')} value={formatDate(d.updated_at, i18n.language)} />
                <Row label={t('document.created')} value={formatDate(d.created_at, i18n.language)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">{t('document.versions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.isPending ? (
                <Skeleton className="h-16" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {versions.data?.data.map((v, i) => (
                    <li key={v.id}>
                      {i > 0 && <Separator className="mb-2" />}
                      <div className="flex items-center justify-between">
                        <span>
                          v{v.version_no} · {formatBytes(v.size_bytes, i18n.language)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(v.created_at, i18n.language)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <DocumentActions document={d} />
          <LifecyclePanel documentId={d.id} />
          <SharePanel documentId={d.id} />
          <SignaturePanel documentId={d.id} versionId={d.current_version?.id} />
        </div>
      )}
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
