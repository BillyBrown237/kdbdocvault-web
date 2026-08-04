import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Download, Star } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
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
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const isFavorite = favorites.data?.data.some((d) => d.id === documentId) ?? false

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(documentId) : addFavorite(documentId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  async function onDownload() {
    if (!doc.data) return
    setDownloading(true)
    setError(null)
    try {
      const blob = await downloadDocumentBlob(documentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.data.title
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (err instanceof NetworkError) setError(t('errors.network'))
      else if (err instanceof ApiProblem) setError(err.detail ?? err.title)
      else setError(t('errors.unknown'))
    } finally {
      setDownloading(false)
    }
  }

  const d = doc.data
  const version = d?.current_version

  return (
    <AppShell>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="rounded-md p-1 hover:bg-muted"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold">
          {d?.title ?? t('app.loading')}
        </h1>
        <button
          type="button"
          onClick={() => favoriteMutation.mutate()}
          disabled={favoriteMutation.isPending}
          className="rounded-md p-2 hover:bg-muted"
          aria-label={t('document.favorite')}
        >
          <Star
            className={`h-5 w-5 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
          />
        </button>
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={downloading || !d}
          className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? t('app.loading') : t('document.download')}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {d && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('document.details')}
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label={t('document.detailStatus')} value={t(`document.status.${d.status}`)} />
              {version && (
                <>
                  <Row
                    label={t('document.size')}
                    value={formatBytes(version.size_bytes, i18n.language)}
                  />
                  <Row label={t('document.mime')} value={version.mime_type} />
                </>
              )}
              <Row label={t('document.updated')} value={formatDate(d.updated_at, i18n.language)} />
              <Row label={t('document.created')} value={formatDate(d.created_at, i18n.language)} />
              {d.tags && d.tags.length > 0 && (
                <Row label={t('document.tags')} value={d.tags.map((x) => x.name).join(', ')} />
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('document.versions')}
            </h2>
            {versions.isPending ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('app.loading')}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {versions.data?.data.map((v) => (
                  <li key={v.id} className="flex items-center justify-between">
                    <span>
                      v{v.version_no} · {formatBytes(v.size_bytes, i18n.language)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(v.created_at, i18n.language)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
