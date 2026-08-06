import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Eye, FileText, Lock } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { resolveRoom, roomContentBlob, roomHeartbeat } from '@/lib/api/queries'
import { InlinePdfViewer } from '@/components/inline-pdf-viewer'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// PUBLIC surface — the magic token in the URL is the credential, exactly like
// /shared and /sign. Anything closed, expired or revoked answers a uniform 404.
export const Route = createFileRoute('/room/$token')({
  component: RoomPortal,
})

const HEARTBEAT_SECONDS = 20

function RoomPortal() {
  const { t, i18n } = useTranslation()
  const { token } = Route.useParams()

  const view = useQuery({
    queryKey: ['room-portal', token],
    queryFn: () => resolveRoom(token),
    retry: false,
  })

  const [open, setOpen] = useState<{ id: string; title: string } | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onOpen(doc: { id: string; title: string }) {
    setBusy(true)
    setError(null)
    try {
      const b = await roomContentBlob(token, doc.id)
      setBlob(b)
      setOpen(doc)
    } catch (err) {
      if (err instanceof NetworkError) setError(t('errors.network'))
      else if (err instanceof ApiProblem)
        setError(err.status === 404 ? t('room.notFound') : (err.detail ?? err.title))
      else setError(t('errors.unknown'))
    } finally {
      setBusy(false)
    }
  }

  function closeViewer() {
    setBlob(null)
    setOpen(null)
  }

  useHeartbeat(token, open !== null)

  if (view.isPending) {
    return <Centered>{t('app.loading')}</Centered>
  }

  if (view.isError || !view.data) {
    return <Centered tone="error">{t('room.notFound')}</Centered>
  }

  const { room, visitor, documents } = view.data
  const expired = room.expires_at ? new Date(room.expires_at) < new Date() : false

  // Reading view: rendered IN the page (canvas), never handed to a browser
  // document tab — rooms are watermarked view-only by design.
  if (blob && open) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="mb-3 flex flex-row items-center justify-between gap-2 px-3 py-2">
            <Button variant="ghost" size="sm" onClick={closeViewer}>
              <ChevronLeft className="h-4 w-4" />
              {t('room.back')}
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{open.title}</span>
            <Badge variant="outline" className="shrink-0">
              {t('room.watermarked')}
            </Badge>
          </Card>
          {blob.type.includes('pdf') ? (
            <InlinePdfViewer data={blob} />
          ) : blob.type.startsWith('image/') ? (
            <RoomImage blob={blob} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">{t('shared.previewFailed')}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-2xl py-8">
        <p className="text-center text-sm font-medium text-muted-foreground">{t('app.name')}</p>
        <h1 className="mt-2 text-center text-2xl font-bold break-words">{room.name}</h1>
        {room.description && (
          <p className="mt-2 text-center text-sm text-muted-foreground">{room.description}</p>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {visitor.name && `${t('room.welcome', { name: visitor.name })} · `}
          {room.expires_at
            ? t(expired ? 'room.expiredOn' : 'room.expiresOn', {
                date: formatDate(room.expires_at, i18n.language),
              })
            : t('room.noExpiry')}
        </p>

        <Card className="mt-6">
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">{t('room.empty')}</p>
            ) : (
              <ul className="divide-y">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">{d.title}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={busy}
                      onClick={() => void onOpen(d)}
                    >
                      <Eye className="h-4 w-4" />
                      {t('room.open')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          {t('room.privacyNotice')}
        </p>
      </div>
    </div>
  )
}

/**
 * Engagement pings while a document is on screen. Paused when the tab is
 * hidden so a forgotten background tab doesn't invent reading time — the
 * backend clamps each ping to 1–120s anyway.
 */
function useHeartbeat(token: string, active: boolean) {
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || !activeRef.current) return
      void roomHeartbeat(token, HEARTBEAT_SECONDS).catch(() => {
        /* analytics are best-effort; never interrupt the reader */
      })
    }, HEARTBEAT_SECONDS * 1000)
    return () => clearInterval(id)
  }, [token, active])
}

function RoomImage({ blob }: { blob: Blob }) {
  const [src] = useState(() => URL.createObjectURL(blob))
  useEffect(() => () => URL.revokeObjectURL(src), [src])
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

function Centered({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <p className={tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-muted-foreground'}>
            {children}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
