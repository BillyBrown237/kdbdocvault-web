import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Eye, FileText, Lock } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { resolveShared, sharedContentBlob, unlockShared } from '@/lib/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicShell } from '@/components/public-shell'
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
      setError(
        err.status === 404 ? t('shared.notFound') : (err.detail ?? t('shared.wrongPassword')),
      )
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
      <div className="app-surface min-h-dvh p-4">
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
            <p className="py-8 text-muted-foreground text-center text-sm">
              {t('shared.previewFailed')}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PublicShell>
      <Card>
        <CardContent className="p-8 text-center">
          {meta.isPending ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <Skeleton className="mx-auto size-12 rounded-xl" />
              <Skeleton className="mx-auto h-5 w-52" />
              <Skeleton className="mx-auto h-9 w-full" />
              <span className="sr-only">{t('app.loading')}</span>
            </div>
          ) : meta.isError ? (
            <p className="text-sm text-destructive">{t('shared.notFound')}</p>
          ) : (
            <>
              <span className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-xl">
                <FileText className="size-6" />
              </span>
              <h1 className="mt-4 text-lg font-semibold break-words">{meta.data.title}</h1>

              {!unlocked ? (
                <form className="mt-6 space-y-3" onSubmit={(e) => void onUnlock(e)}>
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <Lock className="h-4 w-4" />
                    {t('shared.passwordRequired')}
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.login.password')}
                    // The share password is not an account password: offering
                    // to save it would pollute the visitor's password manager
                    // with a credential for one link.
                    autoComplete="off"
                    aria-invalid={error ? true : undefined}
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

              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PublicShell>
  )
}

function ImageView({ blob }: { blob: Blob }) {
  const [src] = useState(() => URL.createObjectURL(blob))
  // The object URL pins the whole blob in memory until it is revoked, and this
  // one never was — the room portal's identical component did revoke. On a
  // view-only share of a large scan that is the document sitting in memory for
  // the life of the tab.
  useEffect(() => () => URL.revokeObjectURL(src), [src])
  return (
    <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
      <img
        src={src}
        alt=""
        draggable={false}
        className="mx-auto max-h-[75vh] shadow-panel rounded-lg border"
      />
    </div>
  )
}
