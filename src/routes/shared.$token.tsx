import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Eye, FileText, Lock } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { resolveShared, sharedContentBlob, unlockShared } from '@/lib/api/queries'
import { InlinePdfViewer } from '@/components/inline-pdf-viewer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// PUBLIC surface — no auth guard by design. The token in the URL is the
// credential; everything dead answers a uniform 404 backend-side.
export const Route = createFileRoute('/shared/$token')({
  component: SharedPage,
})

function SharedPage() {
  const { t } = useTranslation()
  const { token } = Route.useParams()

  const meta = useQuery({
    queryKey: ['shared', token],
    queryFn: () => resolveShared(token),
    retry: false,
  })

  const [password, setPassword] = useState('')
  const [unlockProof, setUnlockProof] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewBlob, setViewBlob] = useState<Blob | null>(null)

  const unlocked = !meta.data?.requires_password || unlockProof !== null

  function fail(err: unknown) {
    if (err instanceof NetworkError) setError(t('errors.network'))
    else if (err instanceof ApiProblem)
      setError(err.status === 404 ? t('shared.notFound') : (err.detail ?? t('shared.wrongPassword')))
    else setError(t('errors.unknown'))
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await unlockShared(token, password)
      setUnlockProof(r.access_token)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function onOpen() {
    if (!meta.data) return
    setBusy(true)
    setError(null)
    try {
      const blob = await sharedContentBlob(token, unlockProof ?? undefined)
      if (meta.data.permission === 'download') {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = meta.data.title
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        // View-only: render IN the page (canvas for PDFs, <img> for images) —
        // never hand the browser a document tab with a download toolbar.
        setViewBlob(blob)
      }
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const viewKind = viewBlob
    ? viewBlob.type.includes('pdf')
      ? 'pdf'
      : viewBlob.type.startsWith('image/')
        ? 'image'
        : 'other'
    : null

  if (viewBlob && meta.data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="mb-3 flex items-center justify-between px-4 py-2">
            <span className="min-w-0 truncate text-sm font-medium">{meta.data.title}</span>
            <Badge variant="outline" className="shrink-0">
              {t('shared.viewOnly')}
            </Badge>
          </Card>
          {viewKind === 'pdf' ? (
            <InlinePdfViewer data={viewBlob} />
          ) : viewKind === 'image' ? (
            <ImageView blob={viewBlob} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              {t('shared.previewFailed')}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">{t('app.name')}</p>

        {meta.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground">{t('app.loading')}</p>
        ) : meta.isError ? (
          <p className="mt-6 text-sm text-red-600">{t('shared.notFound')}</p>
        ) : (
          <>
            <FileText className="mx-auto mt-6 h-10 w-10 text-muted-foreground" />
            <h1 className="mt-3 text-lg font-bold break-words">{meta.data.title}</h1>

            {!unlocked ? (
              <form className="mt-6 space-y-3" onSubmit={(e) => void onUnlock(e)}>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  {t('shared.passwordRequired')}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.login.password')}
                />
                <Button type="submit" className="w-full" disabled={busy || !password}>
                  {busy ? t('app.loading') : t('shared.unlock')}
                </Button>
              </form>
            ) : (
              <Button className="mx-auto mt-6" disabled={busy} onClick={() => void onOpen()}>
                {meta.data.permission === 'download' ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {busy
                  ? t('app.loading')
                  : meta.data.permission === 'download'
                    ? t('shared.downloadAction')
                    : t('shared.viewAction')}
              </Button>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </>
        )}
        </CardContent>
      </Card>
    </div>
  )
}

function ImageView({ blob }: { blob: Blob }) {
  const [src] = useState(() => URL.createObjectURL(blob))
  return (
    <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
      <img
        src={src}
        alt=""
        draggable={false}
        className="mx-auto max-h-[75vh] rounded-md border border-slate-200 shadow-sm"
      />
    </div>
  )
}
