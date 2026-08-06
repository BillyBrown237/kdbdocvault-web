import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, RotateCcw, Upload } from 'lucide-react'

import { ApiProblem, NetworkError } from '@/lib/api/http'
import { documentVersionsQuery } from '@/lib/api/queries'
import { UploadTask } from '@/lib/api/upload'
import { formatBytes, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'

interface Pending {
  task: UploadTask
  progress: number
  error?: string
}

/**
 * Version history + adding a new one. Same resumable pipeline as a first
 * upload, ending at `POST /documents/{id}/versions` instead of `/complete`;
 * a failed attempt keeps its reservation so retry resumes rather than restarts.
 */
export function VersionsPanel({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const versions = useQuery(documentVersionsQuery(documentId))
  const inputRef = useRef<HTMLInputElement>(null)

  const [note, setNote] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)

  async function upload(task: UploadTask, versionNote: string) {
    setPending({ task, progress: 0, error: undefined })
    try {
      const created = await task.runAsVersion(documentId, versionNote || undefined, (fraction) =>
        setPending((p) => (p ? { ...p, progress: fraction } : p)),
      )
      setPending(null)
      setNote('')
      toast.success(t('version.added', { n: created.version_no }))
      // Covers both the detail and its versions (shared key prefix).
      await queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['extractions', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['document-audit', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch (err) {
      const message =
        err instanceof NetworkError
          ? t('errors.network')
          : err instanceof ApiProblem
            ? (err.detail ?? err.title)
            : t('errors.unknown')
      setPending((p) => (p ? { ...p, error: message } : p))
    }
  }

  function onPick(files: FileList | null) {
    if (!files?.length) return
    void upload(new UploadTask(files[0]), note.trim())
    if (inputRef.current) inputRef.current.value = ''
  }

  const list = versions.data?.data ?? []
  const latest = list.reduce((max, v) => Math.max(max, v.version_no), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="h-4 w-4" />
          {t('document.versions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {versions.isPending ? (
          <Skeleton className="h-16" />
        ) : (
          <ul className="space-y-2 text-sm">
            {list.map((v, i) => (
              <li key={v.id}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-medium">v{v.version_no}</span>
                    {v.version_no === latest && (
                      <Badge variant="secondary">{t('version.current')}</Badge>
                    )}
                    <span className="text-muted-foreground">
                      {formatBytes(v.size_bytes, i18n.language)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(v.created_at, i18n.language)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />

        {pending ? (
          pending.error ? (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{pending.error}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void upload(pending.task, note.trim())}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('upload.retry')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="truncate text-xs text-muted-foreground">{pending.task.file.name}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${Math.round(pending.progress * 100)}%` }}
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('version.notePlaceholder')}
              className="h-9 min-w-40 flex-1"
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {t('version.add')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
