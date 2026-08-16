import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Download, Pin, Star } from 'lucide-react'

import { AclPanel } from '@/components/acl-panel'
import { AppShell } from '@/components/app-shell'
import { DocumentActions } from '@/components/document-actions'
import { CommentsPanel } from '@/components/comments-panel'
import { DocumentLinks } from '@/components/document-links'
import { DocumentTrailPanel } from '@/components/document-trail-panel'
import { ExtractionPanel } from '@/components/extraction-panel'
import { SharePanel } from '@/components/share-panel'
import { SignaturePanel } from '@/components/signature-panel'
import { LifecyclePanel } from '@/components/lifecycle-panel'
import { VersionsPanel } from '@/components/versions-panel'
import { WorkflowPanel } from '@/components/workflow-panel'
import {
  addFavorite,
  documentQuery,
  downloadDocumentBlob,
  favoritesQuery,
  pinDocument,
  pinsQuery,
  removeFavorite,
  unpinDocument,
} from '@/lib/api/queries'
import { ApiProblem, NetworkError } from '@/lib/api/http'
import { formatBytes, formatDate } from '@/lib/format'
import { requireTenant } from '@/lib/route-guards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const favorites = useQuery(favoritesQuery)
  const pins = useQuery(pinsQuery)
  const [downloading, setDownloading] = useState(false)

  const isFavorite = favorites.data?.data.some((d) => d.id === documentId) ?? false
  const isPinned = pins.data?.data.some((d) => d.id === documentId) ?? false

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(documentId) : addFavorite(documentId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const pinMutation = useMutation({
    mutationFn: () => (isPinned ? unpinDocument(documentId) : pinDocument(documentId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pins'] }),
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => pinMutation.mutate()}
          disabled={pinMutation.isPending}
          aria-label={t('pins.toggle')}
          title={t('pins.toggle')}
        >
          <Pin className={isPinned ? 'fill-primary text-primary' : 'text-muted-foreground'} />
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

          <VersionsPanel documentId={d.id} />

          <ExtractionPanel documentId={d.id} />
          <DocumentActions document={d} />
          {/* W27 (B58): relationships sit next to the document's own facts,
              above the process panels — "what is this connected to" is a
              question about the document, not about a workflow. */}
          <DocumentLinks documentId={d.id} />
          {/* W31 (B63): the conversation sits with the document's own facts,
              not among the process panels — it's about the document, not a
              workflow step. */}
          <CommentsPanel documentId={d.id} />
          <LifecyclePanel documentId={d.id} />
          <WorkflowPanel documentId={d.id} />
          <AclPanel documentId={d.id} />
          <SharePanel documentId={d.id} />
          <SignaturePanel documentId={d.id} versionId={d.current_version?.id} />
          <DocumentTrailPanel documentId={d.id} />
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
